import { getRouteLocationFromBrowserUrl } from './browserLocation';

/** Publish route locations only, to the embedding page that loaded this Lab. */
export function connectPlayerLocation() {
  if (window.parent === window || !document.referrer) return () => {};
  const parentOrigin = new URL(document.referrer).origin;
  const publish = () => window.parent.postMessage({
    type: 'portfolio:lab-location',
    location: getRouteLocationFromBrowserUrl(),
  }, parentOrigin);
  const receive = (event: MessageEvent) => {
    if (event.source !== window.parent || event.origin !== parentOrigin) return;
    if (event.data?.type === 'portfolio:lab-request-location') publish();
  };
  window.addEventListener('message', receive);
  window.addEventListener('popstate', publish);
  window.addEventListener('layered-route-lab:location-change', publish);
  publish();
  return () => {
    window.removeEventListener('message', receive);
    window.removeEventListener('popstate', publish);
    window.removeEventListener('layered-route-lab:location-change', publish);
  };
}
