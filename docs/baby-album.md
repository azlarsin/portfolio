# 小小宇宙：家庭相册与 iPad 放映室

更新：2026-09-08。实现涉及 `portfolio` 与同级 `azlar-admin`，需分别部署；当前改动尚未发布到正式站点。

## 入口与使用

- 手动访问 `https://me.azlar.cc/baby`，家庭暗号 `0321`。刷新或锁定后需重新输入。
- 公开作品集已完整停用右上角宝宝模块；导航、首页、页脚和 sitemap 均无 `/baby` 链接。家庭页标记 `noindex,nofollow,noimageindex`，不发送 GA 页面事件。
- 未解锁不挂载相册，也不请求照片、模型或 Admin 相册接口。输入框聚焦仅显示外层圆角光晕。
- 十张内置照片依次铺开，Admin 发布的新照片追加在后。点击任一图片进入放映室，支持左右按钮、方向键、滚轮、横向滑动与缩略图选择。
- Escape／关闭返回相册并恢复焦点。自动播放间隔为 5、8、15、30 秒，循环当前全部图片；六秒无操作进入沉浸显示，轻触可唤回控件。

按需求采用纯前端暗号，它只控制页面入口。已发布图片及内置静态素材的直接地址仍可访问；Admin 草稿／隐藏图片由服务端限制读取。

## 照片、纸片、3D

| 模式 | 实现与效果 |
| --- | --- |
| 照片 | 保留原有取景、人物裁切与颜色，使用生成后的 WebP。 |
| 纸片 | 采用手账相纸：窄暖白边、柔和色块背景，Canvas 大图叠两层错位衬纸，随指尖轻微倾斜；保留照片细节，列表／缩略图使用静态 WebP。 |
| 3D | 每张图片提取 468 个面部关键点与 17 个身体关节，生成自己的立体脸型和姿态；原图的五官、发丝和衣服颜色映射到曲面，生成自包含 GLB。大图支持跟随指尖与「转一圈」，全部十张及新增照片使用各自模型。 |

纸片模式内部兼容键仍为 `svg`。下载的 `portrait.svg` 是内嵌原图与纸边的自包含 SVG，**不是纯路径矢量人像**；页面实际读取无损纸片 WebP，不在浏览器执行颜色聚类或轮廓描摹。五官、头发和衣服细节不会被量化成少数色块。

纸片版式参考 [Canva 手账](https://www.canva.com/create/scrapbooks/) 与 [Adobe Express 照片拼贴](https://www.adobe.com/express/create/photo-collage) 的相纸、留白和叠层方向。六片切换继续参考 [Justin3go 的 Canvas 裁片思路](https://github.com/Justin3go/justin3go.com/blob/release/docs/.vitepress/theme/components/PaperJourney.vue)，本项目自行实现几何和交互，没有使用第三方人物素材。无需图片生成服务。

内置照片沿用已有的手工人物轮廓；Admin 上传图按完整画面生成纸片照片，不自动抠出人物。若希望上传后也成为人物贴纸，后续需要补充人物分割或透明图片上传链路。

3D 当前版本为 `portrait-v7-photo-figure`。MediaPipe FaceMesh 按每张脸的 468 个三维关键点生成脸部曲面；眼睛与嘴部的孔洞也按该图的轮廓补面。原图的眉眼、唇色、牙齿和发丝映射到曲面，取消统一绘制的瞳孔、眉毛和鼻孔黑点，不再靠纯色五官模板区分照片。头发轮廓从原图采样，背面补成有厚度的头部。

MoveNet 按每个人单独采样 17 个身体关节，用肩膀、手肘、手腕及可见髋部生成躯干和手臂。衣服正面使用各自照片的颜色与图案，不再统一添加衣领、徽章或披风。已有透明裁切素材还会参与躯干轮廓拟合；完整背景的 Admin 照片用关节估算衣服外形。合影先按原图坐标摆放所有人物，再整体缩放入镜，保留相对大小与高低。内置十张共十一张脸。

模型是有体积的网格，正面细节使用内嵌 PNG 贴图，照片无需额外网络请求。预览图从对应网格和贴图离线渲染。浏览器以柔和中性光补充立体感，减少肤色过黄。头部背面、遮挡部位、耳朵与手指仍是程序补全；关节置信度不足时使用保守姿态，单张照片不能恢复不可见动作和完整真人模型。未检测到清晰人脸时仍使用默认造型，Admin 会提示。

## 转场与 iPad 性能

- **纸片翻页**：六块互补的不规则纸片依次散开、倾斜、翻面并拼合；每次转场先裁好两张图，动画每帧只绘制六块位图，结束后显示完整图像，不留拼接线。
- **星尘聚合**：真实图像像素散开再汇聚，附带少量星光。
- **全息扫描**：光带推进、扫描线和错位切片。
- **惊喜混合**：循环三种转场。所有模式均支持相同的切换操作；系统启用“减少动态效果”时直接切图。

纸片画布仅在大图打开时创建，交互重绘上限约 30 fps，倾斜归位后停止。画廊和缩略图按可见范围加载；照片缓存上限六份、GLB 二进制缓存上限三份、转场快照上限六份。3D 放映室只有一个活动 renderer，切图释放旧网格、材质和纹理；离开／锁定清理画布、事件和缓存。后台暂停转场及播放计时。

在 Safari 手动打开家庭页后，可通过分享菜单“添加到主屏幕”；提供独立 manifest 与图标。播放时申请 Screen Wake Lock，成功后显示“屏幕常亮”；暂停、后台或关闭时释放。不支持全屏／常亮的系统保留普通播放，真实 iPad 的系统行为仍需设备确认。

## Admin 自动生成与发布

登录 `../azlar-admin` 后，侧栏「宝宝相册」进入管理页面 `/baby`。支持多选／拖放上传、编辑名称与排序、发布全部草稿、逐张发布／隐藏和删除。

1. 浏览器将可解码图片缩小至最长边 2048px，转成 JPEG；原文件上限 30 MB，提交上限 2 MB。无法解码的 HEIC 等需先转换。
2. 上传立即保存为草稿，并自动加入持久化生成队列。页面显示等待、生成中、完成或失败，失败可单张重试；关闭管理页不影响后台任务。
3. 服务端逐张生成照片／纸片预览、SVG、数字人参数 JSON、GLB 和模型预览及其缩略图，九份文件全部写好后才标记完成。进程重启会恢复未完成任务，旧素材版本会自动重新排队。
4. 发布后，家庭页每 60 秒、回到前台或手动刷新时同步。生成尚未完成时先显示照片，完成后更新素材；云端失败保留已载入的相册。

后台生成不改变编辑版本，避免把用户正在编辑的名称／顺序判为过期；删除时不会被进行中的任务重新加入相册。最多 500 张新增图片。

## 接口与部署

作品集默认接口基址 `https://admin.azlar.cc/_api/baby`，可用构建变量 `VITE_BABY_API_URL` 更改。

| 方法与路径 | 行为 |
| --- | --- |
| `GET /_api/baby/album` | 读取已发布图片与生成状态；完成后包含照片、纸片预览、SVG、GLB 和模型预览地址。 |
| `GET /_api/baby/media/:id` | 读取已发布 JPEG。 |
| `GET /_api/baby/media/:id/assets/:name?v=:key` | 读取已发布生成素材，校验版本和发布状态；草稿／隐藏／旧版本返回 404。 |
| `GET /_api/baby/photos` | 登录后读取全部新增照片。 |
| `GET /_api/baby/photos/:id/image` | 登录后预览原图，包括草稿。 |
| `GET /_api/baby/photos/:id/assets/:name` | 登录后查看纸片 SVG 或下载模型，包括草稿。 |
| `POST /_api/baby/photos` | 上传 `{ title, dataUrl }`，自动排队生成。 |
| `POST /_api/baby/photos/:id/generate` | 重试生成。 |
| `PATCH /_api/baby/photos/:id` | 带 `expectedVersion` 更新名称、顺序或发布状态。 |
| `DELETE /_api/baby/photos/:id` | 带 `expectedVersion` 删除原图及生成素材。 |

管理接口复用 Admin 身份验证、Origin 与 CSRF 校验。媒体接口只允许白名单文件名，公共读取允许作品集跨域，附带 no-store 和禁止索引响应头。

原图、`album.json` 与生成素材存于独立持久化卷 `azlar-admin-baby-data-prod`，API 配置 `BABY_MEDIA_DIR=/app/data/baby`。备份需包含整个照片卷，原 PostgreSQL 备份不包括这些文件；当前适用于单 API 实例。

MediaPipe FaceMesh、BlazeFace 与 MoveNet 三份模型连同 Apache-2.0 许可证保存在 Admin `apps/api/src/baby/models/`；TensorFlow.js 4.22.0 WASM 在生成子进程执行。API 构建复制权重到 dist，Docker 构建验证本地加载，运行无需联网。单任务 240 秒超时，空闲一分钟释放进程；生产耗时取决于硬件。升级需重新构建 Admin 镜像，旧版本素材自动重新排队。

内置十张素材位于 `apps/portfolio/public/portraits/generated/portrait-v7-photo-figure/`；映射为 `components/baby/generatedAssets.json`。离线维护时运行：

```sh
node apps/portfolio/scripts/generate-baby-assets.mjs
```

脚本默认读取同级 Admin 生成器，也可用 `BABY_GENERATOR_MODULE` 指定文件位置。该依赖仅用于维护素材，作品集日常构建不依赖 Admin 工作目录。

## 验证与主要文件

- 输入框／懒加载：`apps/portfolio/src/pages/BabyPage.tsx`。
- 数据／交互：`apps/portfolio/src/components/baby/babyData.ts`、`BabyAlbum.tsx`。
- 纸片／3D／转场：同目录 `BabyPortrait.tsx`、`babyPaper.ts`、`babyAvatarScene.ts`、`babyEffects.ts`。
- Admin：`../azlar-admin/apps/api/src/baby/`、`apps/admin-web/src/pages/BabyAlbumPage.tsx`。

本轮（v7）按用户要求未运行测试或浏览器视觉验收。已更新生成器和全部内置素材，由用户检查五官、动作、正反面与 iPad 上的实际效果。此前版本的测试结果不作为当前视觉效果的验收结论。
