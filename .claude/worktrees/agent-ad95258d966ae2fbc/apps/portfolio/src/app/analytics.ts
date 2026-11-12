const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{7,}$/
const GOOGLE_ANALYTICS_SCRIPT_ID = 'google-analytics-gtag'
const PRODUCTION_HOSTNAME = 'me.azlar.cc'

type Gtag = (...args: unknown[]) => void

let activeMeasurementId: string | null = null
let previousPageLocation: string | null = null

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

interface AnalyticsEnvironment {
  hostname: string
  isProduction: boolean
}

interface PageView {
  pageLocation: string
  pageTitle: string
}

export function createGtag(dataLayer: unknown[]): Gtag {
  return function gtag() {
    dataLayer.push(arguments)
  }
}

export function canInitializeGoogleAnalytics(
  measurementId: string | undefined,
  environment: AnalyticsEnvironment,
) {
  return (
    environment.isProduction &&
    environment.hostname === PRODUCTION_HOSTNAME &&
    GA4_MEASUREMENT_ID_PATTERN.test(measurementId || '')
  )
}

/**
 * Load the existing Azlar GA4 stream only on the deployed portfolio domain.
 * Automatic page views stay disabled because the router uses replaceState for
 * scroll bookkeeping; App sends one page_view after route metadata is current.
 */
export function initializeGoogleAnalytics() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (
    !canInitializeGoogleAnalytics(measurementId, {
      hostname: window.location.hostname,
      isProduction: import.meta.env.PROD,
    })
  ) {
    return false
  }

  if (document.getElementById(GOOGLE_ANALYTICS_SCRIPT_ID)) {
    activeMeasurementId = measurementId!
    return true
  }

  window.dataLayer ||= []
  window.gtag ||= createGtag(window.dataLayer)

  const script = document.createElement('script')
  script.id = GOOGLE_ANALYTICS_SCRIPT_ID
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId!)}`
  document.head.append(script)

  activeMeasurementId = measurementId!
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })

  return true
}

export function trackGoogleAnalyticsPageView({ pageLocation, pageTitle }: PageView) {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    !activeMeasurementId ||
    !window.gtag ||
    previousPageLocation === pageLocation
  ) {
    return false
  }

  const pageReferrer = previousPageLocation || document.referrer || undefined

  window.gtag('config', activeMeasurementId, {
    page_location: pageLocation,
    page_title: pageTitle,
    update: true,
  })
  window.gtag('event', 'page_view', {
    page_location: pageLocation,
    page_referrer: pageReferrer,
    page_title: pageTitle,
  })

  previousPageLocation = pageLocation
  return true
}
