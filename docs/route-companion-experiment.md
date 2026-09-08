# 首页人物转场实验

实验分支：`feature/svg-route-companion`。同一分支包含照片形象、SVG 插画和 3D 人物三个可比较的版本。新访客默认显示照片形象，已有版本选择继续保留。

## 预览

启动 `pnpm dev:portfolio` 后：

- `/?companion=photo`：以所提供照片为参考的细节人物素材，配合轻微移动、倾转及跨页转场。
- `/?companion=svg`：原创 SVG 分层插画。
- `/?companion=3d`：Three.js 实时 3D 卡通人物。
- 也可以用首页人物下方的「照片形象 / SVG 插画 / 3D 人物」切换；手机上的切换入口位于顶栏。

选择保存在 `portfolio-companion-style`，跨页与刷新保留。URL 参数仅用于指定页面加载时的预览版本，优先于已保存选择；切换按钮不修改 URL 或滚动位置，因此带参数的页面刷新后会重新显示参数指定的版本。禁用浏览器存储时仍可在当前页面会话切换。

首页点击人物会打招呼；桌面移动鼠标，照片人物轻微移动，SVG 眼睛会跟随，3D 人物会转头。首页下滚时，人物按滚动进度拆成六片并移动到右下方，再重组成持续可见的小人物；向上滚动可以反向复原。经过不同内容区块还会触发短暂重组。进入职业经历、项目、简历或案例页面，人物先散开、翻转，在移动过程中保持可辨认的尺寸，最后缩小拼回站点标识旁；点击后返回首页。锚点跳转使用滚动动画，不重复播放切页飞行。浏览器前进、后退和快速导航均沿用同一个人物容器。独立 Demo 和 Poke 手机预览使用各自界面，不挂载人物。

## 三个版本

照片版在 `CompanionPhoto.tsx` 中展示由内置图像生成工具按原照片制作的细节人物素材，保留脸部像素，通过 SVG 轮廓裁切和整体轻微移动接入现有跨页动画。它是照片动效，不能自由旋转查看背面，也不是纯矢量插画。完整提示词及素材路径见 [生成记录](./companion-photo-prompt.md)。

SVG 版使用 `CompanionPortrait.tsx` 中可独立变换的头部、眼睛、披风和手臂路径；没有把照片嵌入 SVG。3D 版使用 `createCompanionModel.ts` 中的原创程序化网格、材质和灯光，包含眼睛、发束、球衣、披风和甜筒；是风格化卡通建模，未进行照片级面部重建。

人物以第 4 张的张嘴吃蛋筒姿态为主，第 5 张补充短发、脸型和毛巾细节：较长的脸部轮廓、露额头的细密短发、深棕色杏仁眼、圆鼻头，以及嘴边咬过的空蛋筒。明黄球衣使用深蓝领口，白色毛巾宽松地绕过肩膀，结偏向人物右侧（画面左侧）。原始照片没有直接复制到公开目录；照片版使用的生成素材存放在 `public/portraits/explorer-photo-v1.png`。

## 实现与边界

- `RouteCompanion.tsx`：跨页持续挂载的按钮，管理首页、浮动与顶栏三个位置。首页滚动可反向驱动碎片进度；切页飞行约 1.18 秒，保持中段人物尺寸，导航立即完成。
- `CompanionFragments.tsx`：六块互补锯齿轮廓，以错峰位移、旋转、横向压缩和阴影实现纸片散开／重组。静止时恢复完整原图，避免拼接缝；支持点击、滚动、切页、区块和版本切换。照片和 SVG 快照缓存复用，WebGL 在同一任务内截取当前帧，始终只有一个 3D 渲染器。抓帧失败会保留完整人物。
- `CompanionPreference.tsx`：版本选择与中英文控制文案。
- `CompanionPhoto.tsx`：照片轮廓、裁切与底部渐隐。
- `CompanionVisual.tsx`：三种显示方式与资源加载；3D 按需加载；首帧、加载失败、WebGL 不可用或上下文丢失时保留 SVG。
- `companionScene.ts`：独立加载的渲染模块，按交互请求绘制，静止、离屏或后台页面不运行持续循环。卸载和切换至 SVG 会释放渲染器、几何和材质。
- `styles/companion.css` 与 `styles/companion-fragments.css`：首页／浮动／顶栏定位、分层及碎片动画、响应式样式。

系统设置「减少动态效果」时，关闭人物跟随、手势、碎片和飞行，位置直接切换；打印时隐藏人物与版本控件。人物保留键盘操作和可访问名称。

参考 [Justin3go 的 PaperJourney](https://github.com/Justin3go/justin3go.com/blob/release/docs/.vitepress/theme/components/PaperJourney.vue) 的持续人物和分层动作思路。参考实现实际为 Canvas + PNG 精灵图，按首页章节滚动切换；本实验的 SVG、3D 网格和跨页面转场均为独立实现，没有复制其人物资源或动画源码。

## 验证

```sh
pnpm --filter @portfolio/web check
pnpm --filter @portfolio/web test
VITE_LAYERED_ROUTE_LAB_URL=https://me.azlar.cc/demos/layered-route-lab pnpm --filter @portfolio/web build
pnpm --filter @portfolio/web test:built
pnpm --filter @portfolio/web test:ui
```

UI 测试覆盖人物落点、同一个 DOM 的跨页往返、浏览器历史、快速导航、锚点、减少动态效果、手机尺寸、版本选择与 WebGL 回退；碎片测试还检查三种形象均有真实画面、只有一个 WebGL 上下文、滚动驻留与反向复原、动画中断及减少动态效果。Playwright 需要已安装浏览器；本机已有 Chrome 时，可运行 `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome pnpm --filter @portfolio/web test:ui --workers=1`。

3D 渲染模块独立分包，当前约 141 KB gzip，只有选择 3D 时加载；照片和 SVG 版本不会创建 WebGL 上下文。
