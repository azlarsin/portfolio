import App from "../../src/App";
import { flattenDemoRouteTree } from "../../src/router/routes";

interface RoutePreviewProps {
  params: Promise<{ path: string[] }>;
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

export function generateStaticParams() {
  return flattenDemoRouteTree().map((route) => ({
    path: route.path.split("/").filter(Boolean),
  }));
}

export default async function RoutePreview({
  params,
  searchParams,
}: RoutePreviewProps) {
  const { path } = await params;
  const pathname = `/${path.map(encodeURIComponent).join("/")}`;
  return (
    <App
      initialPathname={pathname}
      initialLocation={createInitialLocation(pathname, await searchParams)}
    />
  );
}
