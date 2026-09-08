# 照片形象素材生成记录

使用内置 `image_gen` 工具，以用户提供的 Photo 4 为主体与姿态参考，Photo 5 为脸部辅助参考。

采用的生成素材：[`explorer-photo-v1.png`](../apps/portfolio/public/portraits/explorer-photo-v1.png)。原始输出保留于本机 Codex 的 generated_images 目录。

生成图片忠实保留参考素材的插画化细节，并非未加滤镜的真人照片或可自由旋转的 3D 模型。图片生成服务没有给出真实 alpha（再次请求透明输出也没有成功），因此项目保留原始 RGB PNG，在 `CompanionPhoto.tsx` 中用显式 SVG 轮廓裁切排除背景，并使用底部渐隐。该图片必须通过组件的轮廓显示，不应作为带透明通道的素材直接消费。

## 最终采用素材的完整提示词

```text
Use case: identity-preserve / background-extraction.
Asset type: transparent-background portrait cutout for a personal website's animated character.

Input image 1 is the EDIT TARGET and the authoritative face and pose: the boy with the white towel around his shoulders, yellow and navy football shirt, holding the bitten wafer cone to his open mouth. Input image 2 is supporting identity reference only, showing the same boy's face and short hair; do not use its pose.

Primary request: Make a highly faithful, detailed cutout of THE EXACT BOY FROM IMAGE 1, preserving his specific identity, face shape, facial proportions, eye shape/size/spacing, eyelids, eyebrows, nose, lips, skin tone, hairline, spiky short dark hair, ears, curious expression, fingers, yellow shirt, white towel folds and the partially eaten cone. Keep the image 1 pose and viewing angle exactly. The user rejected crude vector and clay approximations because they did not resemble their photos. Likeness is the overriding goal. Keep the reference's detailed, realistically proportioned portrait finish; do not redesign him as a generic child, emoji, doll, Pixar character, toy, or simplified cartoon.

Edit only: remove the whole restaurant background and isolate the complete head, shoulders, towel, raised arm/hand and cone. Frame from just above all hair tips down to the waist/upper hip, with a clean natural cropped lower edge. Preserve facial features and expression as closely as possible to image 1; do not age him, enlarge eyes, change nose/chin, invent a smile, or remove/replace cone. Do not add a scoop of ice cream.
Composition: one centered upright cutout, head and shoulders large and legible at small website size, full width of both shoulders and the raised elbow within frame. Portrait canvas approximately 4:5, very little empty border (about 3–5%). Keep all hair tips within the image. Do not add any objects or text.
Background: genuinely transparent alpha, no checkerboard pixels, no colored backdrop, no border, no ground or cast shadow. Preserve fine semi-transparent hair edges and towel detail.
Output: high-resolution PNG cutout, face faithfully matching image 1 rather than a reinterpretation.
```
