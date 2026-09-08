# 人物动作与碎片转场

分支：`feature/svg-route-companion`。支持照片形象与 3D 人物。旧 SVG 插画模式已删除；已有 `svg` 偏好和 `?companion=svg` 链接会自动显示照片。

## 使用

- `/?companion=photo`：照片动作库，共 10 张。
- `/?companion=3d`：实时 3D 人物，保留吃蛋筒、做鬼脸、蛋筒小喇叭三种姿态。
- 点击人物切换下一个动作；「选择动作」可打开图片选择器，手机也可使用。
- 新追加小小笑脸、托腮想想、惊喜一下、奶油胡子、一起合影、比个耶、骑行出发七张照片。图片直接使用用户提供的素材，组件轮廓与取景排除截图界面和背景。
- 进入内页后人物停靠页头，内页滚动不触发碎片、放大或动作切换；点击页头人物返回首页。

显示风格保存在 `portfolio-companion-style`。URL 只指定本次页面加载的风格；按钮不会修改 URL、页面滚动位置或浏览器历史。无存储权限时仍可切换。

## 滚动与播放规则

滚动只决定下一个场景，**不再直接控制碎片动画帧**。滚动停止约 160ms 后确认目标；首页离开/返回使用不同阈值，区块边界另有 64px 的方向缓冲，防止边缘小幅来回滚动重复触发。

所有切换串行播放：当前动画完整结束，其间最多保留最后一个目标。快速跨过多个区域不逐一回放中间场景；回到原区域会取消已经过时的排队目标。手动选择和连续点击同样合并为最后的选择。真正切页、横向视口变化和离开浏览器页面时才取消旧过渡，确保人物始终能完整恢复。

## 随机轨迹与大片切分

每次动画开始时生成一次随机方案，包括散开、旋绕、扇开、波浪四类路径、方向、旋转角度、拼接顺序和切分边界。相邻动画不重复同一类路径；播放期间方案固定，不逐帧随机。

始终使用六块较大的互补碎片。切线只在有限范围内移动，横向约 136–184px、纵向约 100–135px 和 220–244px（画布为 320×340），避免细小碎屑。翻转时仍保留至少约一半的横向宽度。每片经过自身翻转中点才换成下一动作的对应画面，结束后显示完整照片/模型，避免拼接缝。

## 文件

- `RouteCompanion.tsx`：串行播放、单个待处理目标、稳定区块判定、首页/浮动/页头位置。
- `CompanionFragments.tsx`：两种动作快照、随机大片合成、播放结束通知、故障恢复。快照缓存最多保留四项，图片只在需要时加载。
- `companionTrajectory.ts`：一次生成并固定的随机轨迹、互补切线和拼回顺序。
- `companionPhotos.ts`、`CompanionPhoto.tsx`：10 张照片的取景与轮廓；显示与快照使用同样的参数。
- `CompanionPreference.tsx`：显示偏好和动作选择器。照片库按需打开，3D 模式只展示自身支持的姿态。
- `companionScene.ts`、`createCompanionModel.ts`：单个 WebGL 渲染器与三种模型姿态；WebGL 不可用时显示照片。

素材位于 `apps/portfolio/public/portraits/`。最初吃蛋筒图片的生成提示词见 [生成记录](./companion-photo-prompt.md)。后续照片均为用户提供的图片，没有重新生成脸部。

系统设置减少动态效果时，动作和位置直接切换，不播放碎片、跟随或飞行动画；打印时隐藏人物。独立 Demo 和手机预览不挂载人物。参考 [Justin3go 的 PaperJourney](https://github.com/Justin3go/justin3go.com/blob/release/docs/.vitepress/theme/components/PaperJourney.vue) 的持续人物与分层转场思路，人物资源和当前调度、随机轨迹代码均独立实现。

## 验证

```sh
pnpm --filter @portfolio/web check
pnpm --filter @portfolio/web test
VITE_GA_MEASUREMENT_ID=G-HXZEF459C9 pnpm build:github-pages
PLAYWRIGHT_CHROMIUM_CHANNEL=chrome pnpm --filter @portfolio/web test:ui --workers=1
```

界面测试覆盖动作库、旧偏好迁移、快滚只取最后目标、播放期间排队、边界抖动、连续点击、路径/大片大小随机而帧间稳定、切页、内页页头静止、手机导航、减少动态效果以及真实画面逐片切换。
