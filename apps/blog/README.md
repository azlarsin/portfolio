# Azlar Blog

`apps/blog` is a static Astro site for `blog.azlar.cc`. It renders all public Markdown at build time; it does not fetch GitHub Raw Markdown in the browser and its build commands never commit or push.

## Local commands

```bash
pnpm blog:migrate
pnpm dev:blog
pnpm check:blog
pnpm build:blog
```

`content:migrate` reads the current sibling legacy sources at `../../blog/blog-source`, converts their one-sided YAML header into standard frontmatter, and copies `images/`, `demos/`, `favicon.ico`, and `CNAME` from the legacy GitHub Pages repository. The committed output is intentionally self-contained after the migration has run.

The current content boundary is local Markdown only. A future importer may read a reviewed publication snapshot from `https://admin.azlar.cc/_api/` (later movable to `api.azlar.cc`), but the public build must remain independent of that API. Images remain static GitHub Pages assets.

## GitHub Pages hand-off

The manual workflow in `../../.github/workflows/publish-blog-pages.yml` builds this app and publishes only `apps/blog/dist` to `azlarsin/azlarsin.github.io`.

Before manually dispatching it, add `BLOG_PAGES_DEPLOY_KEY` to the source repository's Actions secrets. Its value must be the private half of a dedicated SSH deploy key that has **write** access only to `azlarsin/azlarsin.github.io`; add the public half to that target repository as a deploy key with **Allow write access** enabled. The workflow checks out and pushes the target's explicit `master` branch using that key, never exposes its value in commands or logs, preserves the target checkout's `.git` directory during `rsync --delete`, and only commits when the staged artifact differs. The workflow is deliberately manual so it cannot change the existing `me.azlar.cc` Pages deployment.
