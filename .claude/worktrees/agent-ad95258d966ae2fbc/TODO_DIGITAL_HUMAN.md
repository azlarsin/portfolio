# TODO：暂时隐藏人物模块，后续替换为数字人照片

更新日期：2026-09-08。

## 目标与当前状态

当前右上角人物使用孩子的形象，计划先隐藏整个人物模块，之后使用用户另行提供的数字人照片恢复展示。

2026-09-08 追加实现：**公开作品集人物模块已完整停用**，原有宝宝照片迁入手动访问的 `/baby` 家庭相册，入口暗号为 `0321`。Admin 已追加多图上传管理代码。详见 [家庭相册说明](docs/baby-album.md)。

以下保留原模块结构与数字人替换计划；临时隐藏仅约束公开作品集页面，独立家庭相册保留宝宝素材。

- [x] 读取人物模块的挂载、照片、动作、转场和布局逻辑。
- [x] 在项目根目录记录隐藏范围和数字人替换步骤。
- [x] 实施临时隐藏并检查页面布局。
- [ ] 等待用户提供数字人照片。
- [ ] 接入新素材、验证后恢复模块展示。

## 原模块结构（实现保留，公开挂载已关闭）

| 位置 | 职责与关联影响 |
| --- | --- |
| [AppShell.tsx](apps/portfolio/src/components/layout/AppShell.tsx) | `CompanionProvider` 包裹站点，`RouteCompanion` 常驻外壳；人物在普通页面之间保持同一个实例。 |
| [HomeHero.tsx](apps/portfolio/src/components/home/HomeHero.tsx) | 挂载 `CompanionHomeSlot`，包含首页人物定位槽、装饰、动作说明及桌面切换控件。 |
| [Topbar.tsx](apps/portfolio/src/components/layout/Topbar.tsx) | 提供内页停靠槽；首页还提供移动端照片／3D／动作选择控件。 |
| [RouteCompanion.tsx](apps/portfolio/src/components/companion/RouteCompanion.tsx) | 处理首页、右下角浮动和页头停靠三种位置，以及滚动、点击、路由变化和转场调度。 |
| [CompanionPreference.tsx](apps/portfolio/src/components/companion/CompanionPreference.tsx) | 管理风格与当前动作；动作选择弹窗使用照片缩略图，包括 3D 模式下的三个动作。 |
| [companionPhotos.ts](apps/portfolio/src/components/companion/companionPhotos.ts) | 按动作配置素材路径、原图宽高、`viewBox` 取景和 `outline` 裁切轮廓。 |
| [CompanionPhoto.tsx](apps/portfolio/src/components/companion/CompanionPhoto.tsx) | 在 SVG 中显示原图，通过轮廓裁切背景，并对底部做渐隐。 |
| [companionPoses.ts](apps/portfolio/src/components/companion/companionPoses.ts) | 定义动作列表、中英文名称、循环顺序、区块映射及 3D 兼容动作。 |
| [CompanionVisual.tsx](apps/portfolio/src/components/companion/CompanionVisual.tsx) | 默认显示照片；选择 3D 后动态加载 WebGL 场景，加载中或失败时回退到照片。 |
| [CompanionFragments.tsx](apps/portfolio/src/components/companion/CompanionFragments.tsx) | 对切换前后的形象截图，生成六块互补碎片；照片快照复用同一份取景与轮廓配置。 |
| [companionTrajectory.ts](apps/portfolio/src/components/companion/companionTrajectory.ts) | 为每次转场生成固定的随机路径、切分和拼接顺序。 |
| [companion.css](apps/portfolio/src/styles/companion.css)、[companion-fragments.css](apps/portfolio/src/styles/companion-fragments.css) | 人物、选择器、碎片和响应式样式；同时直接修改首页网格、标题留白和页头间距。 |

### 显示与交互

- 首页首屏显示在右侧；向下滚动后移至右下角，并按首页区块切换动作。滚动停止约 160ms 后确认目标，边界设有缓冲。
- 动画串行播放，播放期间仅保留最后一个待处理目标；切页、横向视口变化和页面转入后台会取消旧过渡并恢复完整人物。
- 首页点击人物切换动作并显示问候；内页人物停靠页头，点击返回首页，内页滚动不触发动作转场。
- 默认风格为 `photo`，也支持 `3d`。URL 参数 `?companion=photo`／`3d` 优先于本地偏好；旧 `svg` 参数映射为照片。
- 风格存储键为 `portfolio-companion-style`，初始化和切换风格都会写入；没有现成的“关闭模块”状态。动作本身没有持久化存储。
- 减少动态效果时直接切换位置与动作；打印时隐藏人物。独立 Demo 与 Poke render 页面不经过 `AppShell`，因此不挂载该模块。
- [entry-server.tsx](apps/portfolio/src/entry-server.tsx) 生成静态页面时同样使用 `AppShell`，隐藏需要同时覆盖静态输出与客户端展示。

### 素材现状

照片库目前有 10 个动作：`snack`、`play`、`peek`、`little`、`thinking`、`surprise`、`cream`、`together`、`peace`、`riding`。3D 模型只支持前三个动作，其余动作会回退到 `snack`。

素材位于 [apps/portfolio/public/portraits/](apps/portfolio/public/portraits/)，包括 `explorer-photo-v1.png` 和九张 JPG。现有轮廓与取景均针对当前图片手工配置；更换文件路径不足以完成数字人适配。

## 第一阶段：临时隐藏

已增加 `companionConfig.ts` 中的统一开关 `PUBLIC_COMPANION_ENABLED = false`。开关同时约束 Provider、人物、首页定位槽、页头控件和相关布局；URL 风格参数与已有本地偏好无法覆盖。

- [x] 在 `AppShell` 停止挂载 `RouteCompanion`；关闭状态不初始化人物偏好 Provider 的存储逻辑。
- [x] 隐藏 `HomeHero` 中的 `CompanionHomeSlot`，包含装饰、动作说明和桌面选择器。
- [x] 隐藏 `Topbar` 中的停靠槽及移动端选择器，并同步处理 `data-companion-home` 相关样式。
- [x] 将人物启用时的布局规则限定在启用状态：关闭后恢复首页单列，移除为人物预留的桌面右列、移动端标题右侧 padding 和相关高度／间距调整。
- [x] 确保人物 DOM、弹窗、碎片画布及交互监听均不挂载；当前碎片组件会预热当前和下一动作的照片快照，仅用 CSS 隐藏仍会留下图片请求与运行逻辑。
- [x] 检查静态 HTML 中也没有人物图片引用、选择器或占位装饰。
- [x] 保留可复用的组件与动画实现，便于接入新素材后恢复。

按新的家庭相册需求，原素材继续用于 `/baby`，没有删除公开目录中的文件。前端暗号只控制页面入口，原图片直接地址仍可访问。

## 第二阶段：接入用户提供的数字人照片

- [ ] 收到素材后确定实际照片数量、动作及命名；不预先假定必须保留 10 张。只有一张时先采用单一形象，调整动作选择与区块映射以匹配实际素材。
- [ ] 将新素材使用独立文件名放入资源目录，避免沿用旧 URL 导致缓存继续展示旧图片。
- [ ] 更新 `companionPhotos.ts` 的路径、真实尺寸、取景和裁切轮廓，校准主体大小、脸部位置及底部渐隐。
- [ ] 优先使用带真实透明通道的素材；若采用透明图直接显示，需要同步调整 `CompanionPhoto` 和碎片快照逻辑，避免旧轮廓裁掉新人物。
- [ ] 更新 `companionPoses.ts` 的动作集合、中英文文案和兼容映射，以及 `RouteCompanion` 中的默认动作、内页动作和“小小探索者”标签。
- [ ] 同步替换动作选择器缩略图、3D 加载／失败回退图和碎片快照，确保任何展示路径都不会重新出现旧照片。
- [ ] 按新形象确定是否继续提供现有 3D 模式；更换照片不会自动改变 `createCompanionModel.ts` 中的程序化模型。
- [ ] 新图继续使用站内资源路径；碎片截图的 `inlineImage` 目前要求图片同源。
- [ ] 更新 [人物模块说明](docs/route-companion-experiment.md)；现有 [照片生成记录](docs/companion-photo-prompt.md) 属于旧素材记录，新素材另行记录来源与处理方式。

## 验收与恢复

- [x] 隐藏状态：桌面和移动端首页、滚动后及内页均无人物、选择入口或空白占位；键盘导航与页头功能正常。
- [x] 隐藏状态：带 `?companion=photo`、`3d`、`svg` 的链接及旧本地偏好均不能恢复人物；刷新和切页时无闪现，页面不请求人物照片或 WebGL 场景。
- [x] 按关闭／启用状态调整现有 `apps/portfolio/tests/ui/companion*.pw.ts`，保留启用时的交互覆盖，避免临时隐藏导致原有“默认可见”断言失效。
- [ ] 替换后检查所有动作、照片缩略图、3D 回退与逐片转场，确认没有旧图、错裁、空白快照或拼接错位。
- [ ] 检查中英文、明暗主题、窄屏、减少动态效果、路由切换和滚动后的表现。
- [ ] 后续是否恢复自动化测试按用户新的指示执行；当前改完由用户检查效果。
- [ ] 新素材适配及验证完成后，再将统一开关恢复为启用。

## 家庭相册追加修正

- [x] 修复暗号输入框聚焦出现双重边框的问题。
- [x] 采用相纸手账拼贴风格，保留原图细节，加入窄边、柔和背景和错位衬纸；Canvas 执行六片翻转，静止时停止重绘。
- [x] 为内置十张图片各自提取 468 点面部曲面与 17 点身体姿态；使用原图五官、头发和衣服细节生成独立 GLB，移除鼻孔黑点和统一服装装饰；合影保留各自大小与位置。
- [x] Admin 上传后自动排队生成纸片 SVG／预览和独立 GLB，提供状态、失败重试与素材查看／下载。
- [x] 模型文件预置于 Docker 镜像；生产环境无需联网推理，原图与生成素材保存在照片卷。
- [ ] 在真实 iPad 上确认 Safari 全屏、屏幕常亮与长期放映表现。
- [ ] 本轮 v7 由用户直接检查视觉效果，不运行测试。后续按反馈改进发型、遮挡、手指与低置信度姿态；背面仍为程序补全，准确还原真人需多视角素材或人工模型。

数字人替换仍等待用户提供新素材；家庭相册独立保留宝宝照片，不随未来公开人像更换而删除。验证命令和当前边界见 [家庭相册说明](docs/baby-album.md)。
