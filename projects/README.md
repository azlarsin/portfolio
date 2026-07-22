# Projects

后续独立作品统一放在本目录下，每个一级子目录都是一个 workspace package。

最小约定：

```json
{
  "name": "my-project",
  "private": true,
  "scripts": {
    "dev": "vite --port 3001 --strictPort",
    "build": "vite build"
  }
}
```

请为每个项目分配唯一端口，并在 `apps/portfolio/src/content.ts` 中登记展示内容。
