import App from "../../src/App";
import { flattenDemoRouteTree } from "../../src/router/routes";

interface RoutePreviewProps {
  params: Promise<{ path: string[] }>;
}

export function generateStaticParams() {
  return flattenDemoRouteTree().map((route) => ({
    path: route.path.split("/").filter(Boolean),
  }));
}

export default async function RoutePreview({ params }: RoutePreviewProps) {
  const { path } = await params;
  const pathname = `/${path.map(encodeURIComponent).join("/")}`;
  return <App initialPathname={pathname} />;
}
