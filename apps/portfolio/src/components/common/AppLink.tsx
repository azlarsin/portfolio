import { forwardRef, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { navigate } from '../../app/router'

interface AppLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
  children: ReactNode
}

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink(
  { to, children, onClick, ...props },
  ref,
) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === '_blank'
    ) {
      return
    }

    const destination = new URL(to, window.location.href)
    if (destination.origin !== window.location.origin) {
      return
    }

    event.preventDefault()
    navigate(`${destination.pathname}${destination.search}${destination.hash}`)
  }

  return (
    <a ref={ref} href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  )
})
