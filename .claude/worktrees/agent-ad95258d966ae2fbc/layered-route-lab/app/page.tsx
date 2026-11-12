import App from "../src/App";
import {
  DEFAULT_DEMO_ROUTE_PATH,
  resolveRoute,
} from "../src/router/routes";

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function createInitialLocation(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  });
  const search = params.toString();
  return `${pathname}${search ? `?${search}` : ""}`;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const requestedRoute = resolvedSearchParams.route;
  const requestedPath = typeof requestedRoute === "string"
    ? resolveRoute(requestedRoute)?.path || DEFAULT_DEMO_ROUTE_PATH
    : DEFAULT_DEMO_ROUTE_PATH;
  return (
    <App
      initialPathname={requestedPath}
      initialLocation={createInitialLocation(requestedPath, resolvedSearchParams)}
    />
  );
}
