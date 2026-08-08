import App from "../src/App";
import { DEFAULT_DEMO_ROUTE_PATH } from "../src/router/routes";

export default function Home() {
  return <App initialPathname={DEFAULT_DEMO_ROUTE_PATH} />;
}
