import vinext from "vinext";
import { defineConfig, loadEnv } from "vite";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
};

export default defineConfig(async ({ command, mode }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  if (command === "build") {
    const fileEnv = loadEnv(mode, process.cwd(), "");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || fileEnv.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL is required for production builds. Copy .env.production.example and set the public site origin.",
      );
    }

    const parsedSiteUrl = new URL(siteUrl);
    const isLocalSite = ["localhost", "127.0.0.1", "::1"].includes(
      parsedSiteUrl.hostname,
    );

    if (!["http:", "https:"].includes(parsedSiteUrl.protocol)) {
      throw new Error("NEXT_PUBLIC_SITE_URL must use http:// or https://.");
    }

    const allowLocalDemoUrl =
      process.env.ALLOW_LOCAL_DEMO_URL || fileEnv.ALLOW_LOCAL_DEMO_URL;
    if (isLocalSite && allowLocalDemoUrl !== "1") {
      throw new Error(
        "Production builds cannot use a localhost site URL. Use pnpm build:local for local verification.",
      );
    }

    process.env.NEXT_PUBLIC_SITE_URL = siteUrl;
  }

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
