# 设计文档 · TinyVBD book 增补「Newton 篇」

**日期**：2026-06-08
**作者**：与用户协作（brainstorming）
**状态**：待用户 review

---

## 1. 目标与受众

在现有 **TinyVBD 交互式教程**（`learn/`，29 章，Part 0–6 + 附录）基础上，**增补一套新内容**，带读者从已经吃透的 TinyVBD（~400 行 2D mass-spring strand）系统过渡到 **Newton 物理引擎里的 VBD**——以 **particle VBD（cloth / soft body）为主线**，补上 **Warp + Newton 架构地基**，并以 **AVBD（rigid）概览**收尾。

**读者画像（在原书受众之上叠加）**：
- 已读完 TinyVBD 原书，吃透了 `min G(x)`、per-vertex `Δx = H⁻¹f`、Gauss-Seidel sweep、Chebyshev、高质量比稳定性。
- 懂 **Isaac / OpenUSD**（来自 EBench 背景）。
- **完全不懂 Newton，也不懂 Warp**（Newton 的 GPU kernel 语言）。

**语气与语言规约**（沿用原书 `_AGENT_BRIEF.md`）：
- 中文负责解释性叙述，娓娓道来、讲「为什么」。
- **英文保留所有架构术语、命令名、性能指标、概念名**（VBD, Warp, kernel, graph coloring, Neo-Hookean, augmented Lagrangian…）。
- 每节 `<p class="lede">` 导言开场，小标题收束并预告下一节。

---

## 2. 关键决策（已与用户确认）

| 维度 | 决策 |
|---|---|
| 覆盖范围 | **Particle VBD 为主 + Newton/Warp 地基**；AVBD/rigid 作收尾概览 |
| 放置位置 | **扩展现有这本书**，追加 Part 7–10 + 附录条目（同一 `content.js`、CSS、widget registry） |
| 代码深度 | **概念优先 + 关键 kernel 片段**，不逐行走读全部 ~10k 行 |
| Warp 入门 | **要**，专门一个 Part（Part 7）讲 Warp + Newton 骨架 |
| 交互控件 | **做几个新 widgets + 复用旧的** |
| 规模 | **按完整大纲做**：Part 7–10，~17 章 |
| cloth-lab | **做**，作为 Part 8/9 的压轴可拖交互体验 |

---

## 3. 核心教学装置

### 3.1 第三座桥：TinyVBD 桥（teal/青）
原书有两座桥：GAMES103 桥（紫 `g103`）、PBD 桥（琥珀 `pbd`）。新内容里读者最强的锚点是 **TinyVBD 自身**，因此新增第三座桥：

```html
<div class="bridge tinyvbd"><div class="c-h"><span class="tag">从 TinyVBD 看</span> 标题</div><p>…</p></div>
```

- CSS 新增 `.bridge.tinyvbd`（teal 配色，复用现有 `.bridge` 结构 + 新 `--tv` / `--tv-soft` 变量）。
- 用途：每引入一个 Newton 概念，就把它接回读者已吃透的那根 strand。例如「Newton 的 `solve_elasticity` kernel 里的 `f = mass*(y-x)/dt²` 就是你在 `solve()` 里写的那行」。

### 3.2 Isaac/USD 旁注（轻量，复用 `callout note`）
读者懂 Isaac/USD，用普通 `callout note` 做类比旁注（不新建桥样式），点明 `Model/State` ↔ USD stage、coloring、quaternion order `(x,y,z,w)` vs Isaac `(w,x,y,z)` 等。

### 3.3 全篇主线一句话
> `min G(x)` 没变；变的是「一根 strand 串行 → 一块 cloth 在 GPU 上按颜色并行」。

并**诚实点名两处 Newton particle 路径与 TinyVBD 的差异**（来自代码核对）：
1. Newton 的 particle solve **没有 Chebyshev 加速**（只有按颜色的 Gauss-Seidel）。
2. Newton 用**朴素惯性初始化** `y = x + v·dt`，**不是** TinyVBD 的自适应初始化（`accelerationComponent` 那套）。

---

## 4. 章节大纲（新增 Part 7–10）

所有 `file` 路径相对 `learn/` 根；新建目录 `chapters/07-newton-foundations/` … `chapters/10-avbd/`。

### Part 7 · Newton 的世界 · Foundations (Warp + Newton)
- **7-1** Newton 是什么：从 Isaac/USD/PhysX 到 Warp-native 引擎。定位 + 与 Warp / `warp.sim`(deprecated) / MuJoCo Warp / Isaac Lab / OpenUSD 的关系；为何 VBD/AVBD 在其中。
- **7-2** Warp 编程模型：`@wp.kernel` / `@wp.func` / `wp.array` / `wp.launch` / `wp.tid()` 的 SPMD 心智模型；`wp.vec3/mat33`；CUDA graph capture 一句话。〔widget: **warp-launch**〕
- **7-3** Newton 数据模型：`Model`(静态) / `State`(动态 `particle_q/qd`) / `Control` / `Contacts` / `ModelBuilder`，以及 `solver.step(state_in, state_out, control, contacts, dt)` 契约。
- **7-4** 一个最小 Newton 程序：`builder → color() → finalize → state/control/contacts → step 循环`（faithful 重构自 `example_basic_pendulum.py`，并指向一个 cloth/particle 例子）。

### Part 8 · 从一根 strand 到一块 cloth · TinyVBD → Newton particle VBD
- **8-1** 同一个 `min G(x)`，搬上 GPU：什么没变、什么变了（**桥章**，建立主线）。
- **8-2** `SolverVBD` 全景：`step()` 的三段式 **Initialize / Iterate / Finalize**。
- **8-3** particle 的惯性初始化（`forward_step` kernel），**对照** TinyVBD 自适应初始化并点明差异。
- **8-4** per-vertex Newton step 在 Warp 里：`f_i`/`H_i`(3×3) 装配 + `Δx = H⁻¹f`（`solve_elasticity` kernel 关键片段，惯性项 `mass*(y-x)/dt²` + `mass/dt²·I`）。
- **8-5** graph coloring 与并行 sweep：颜色驱动的 Gauss-Seidel（同色并行、颜色依次），对照 TinyVBD 串行。〔widgets: **graph-coloring**, **parallel-sweep**〕

### Part 9 · 真实的弹性与碰撞 · Real Elasticity & Collisions
- **9-1** 弹性元件谱：Neo-Hookean **membrane**(cloth) / **volumetric**(soft) / **dihedral bending** / **spring**；对照 TinyVBD 的弹簧 Hessian。〔widget: **cloth-lab**（压轴，可拖 2D 三角网格 cloth）〕
- **9-2** SPD 投影与 Rayleigh damping：production 稳定性细节（`D = kd·ke`、stable Neo-Hookean `λ_NH = λ+μ`、Hessian 的 SPD clamp）。
- **9-3** self-collision 与 penetration-free：BVH + 截断（DAT），对照 TinyVBD「无碰撞」。

### Part 10 · AVBD 与 rigid · 收尾概览
- **10-1** VBD 软肋回顾（高刚度比、硬约束、穿透）→ AVBD 思想：augmented Lagrangian、penalty ramping（`k_start` / `β=10` / `γ=0.99`、warm-start 衰减 + 迭代内增长、hard vs soft 封顶）。〔widget: **avbd-penalty-ramp**〕
- **10-2** Newton 里的 rigid AVBD 一瞥：joints/contacts、它在引擎中的位置、Newton 当前限制（rigid 用软约束自适应惩罚）；「进一步读什么」收尾（VBD/AVBD 论文、Newton docs、demo）。

### 附录增补（追加到现有 appendix）
- **a-4** Newton / Warp 术语表（追加条目或新文件）。
- **a-5** `TinyVBD ↔ Newton ↔ Isaac` 概念对照速查表。
- **a-6** Newton / VBD / AVBD 参考文献（含已验证 URL）。

> 附录是追加新文件（a-4/a-5/a-6）而非改写现有 a-1/a-2/a-3，避免污染原书内容。

---

## 5. 新 widgets（4 个新 + cloth-lab 压轴 = 5 个；复用 3 个旧的）

每个 widget 是 `learn/assets/js/widgets/<name>.js`，按现有 registry 约定 `data-widget` 自动挂载；纯前端、零依赖、离线可用（KaTeX/字体除外）。

| widget | 章节 | 说明 |
|---|---|---|
| **warp-launch** | 7-2 | SPMD 小可视化：一个线程网格各自跑同一 kernel，用 `wp.tid()` 取自己那份数据；点一下看每个 thread 的 index/数据。 |
| **graph-coloring** | 8-5 | 2D 三角网格上做顶点着色、数颜色数；切「顶点图(primal) vs 约束图(dual)」看为什么顶点着色颜色更少。 |
| **parallel-sweep** | 8-5 | 动画：按颜色的并行 Gauss-Seidel（同色顶点同时更新、颜色依次推进），与 TinyVBD 串行 sweep 并排。 |
| **cloth-lab**（压轴） | 9-1（capstone） | 真做一块可拖的 2D 三角网格 cloth：membrane + bending VBD 仿真，按颜色 sweep。strand-lab 的放大版。**需独立 headless 物理验证。** |
| **avbd-penalty-ramp** | 10-1 | 调 `k_start`/`β`/`γ`，看 penalty stiffness 每帧 warm-start 衰减 + 迭代内增长、`λ` 累积、hard/soft 封顶曲线。 |

**复用旧 widget**：`strand-lab`（8-1 回顾钩子）、`vbd-sweep`（8-4/8-5 对照串行）、`mass-ratio`（10-1 软肋回顾）。

**cloth-lab 物理内核**：新建 `assets/js/widgets/cloth-core.js`，是 Newton particle membrane+bending VBD 的 2D 忠实小型移植（类比原书 `vbd-core.js` 之于 strand）。能量/力/Hessian 形式以 `_NEWTON_BRIEF.md` 里 file:line 引用的 Newton kernel 为准。

---

## 6. 构建架构（沿用现有零构建体系）

1. **`content.js`**：在 `parts` 数组末尾追加 4 个新 Part（`p7`–`p10`）+ 附录新增 section；保持它作为导航/搜索/上下页的单一真相源。每个 section 写好 `id/title/file/keywords`（keywords 中英混合，供客户端搜索）。
2. **章节 HTML**：每个文件完整 HTML，复制参考文件的 `<head>`/topbar/layout/search-overlay/底部 script 块；`data-root="../../"`（两级深度）；只改 `<title>`/`data-section`/`.eyebrow`/`<h1>`/`<p class="lede">`/正文。`<h2>/<h3>` 带唯一 `id`。
3. **底部 script 块**：在所有新章节（以及理想情况下回填到原书章节的模板）里加载 5 个新 widget 脚本 + `cloth-core.js`。维护一处「全 widget 脚本清单」片段，统一注入。
4. **CSS**：`assets/css/book.css` 追加 `.bridge.tinyvbd` 及 teal 配色变量（`--tv`/`--tv-soft`，light/dark 各一）。不动现有规则。
5. **FACTS 文档**：新建 `learn/_NEWTON_BRIEF.md`，整合本次三份研究 digest（particle VBD 代码 / Newton+Warp 架构 / 外部论文），全部带 file:line 或 URL 引用。作为各章写作 subagent 的唯一事实来源（**只用 brief + Read 到的真实代码，不臆造数字**）。
6. **并行写作**：各 Part 章节由并行 subagent 按 `_NEWTON_BRIEF.md` + 黄金参考章节写出；widget 由我自己写并验证。

---

## 7. 数据流 / 模块边界

- **导航层**：`content.js`（数据）→ `book.js`（运行时生成 sidebar/prevnext/cover/search）。新内容只往 `content.js` 加数据，不改 `book.js`。
- **内容层**：每章 HTML 自包含，仅依赖 `book.css` + `content.js` + widget 脚本。章节间用相对链接交叉引用。
- **交互层**：`registry.js` 按 `data-widget` 名挂载；每个 widget 自包含一个 `mount(el)`。`cloth-lab` → `cloth-core.js`（物理）+ `cloth-lab.js`（渲染/交互），与现有 `strand-lab`/`vbd-core` 同构。
- **事实层**：`_NEWTON_BRIEF.md` 是写作期的事实边界；运行时不依赖它。

每个单元可独立理解/测试：改一个 widget 不影响章节文本；加一章不影响其它章；改 CSS 变量不影响内容结构。

---

## 8. 验证与错误处理

- **widget 物理正确性**：沿用原书做法——`cloth-core.js` 等核心 widget 用 node DOM stub + headless 物理测试验证（能量单调下降、静止收敛、对称性等不变量）。
- **真实浏览器渲染**：原书遗留问题是没做过真实浏览器渲染测试（沙箱无 chromium/playwright）。本次**若环境允许则补一次真实浏览器 pass**；否则沿用静态 + node-stub 验证并在交付说明里诚实标注。
- **事实校验**：外部研究中标为 unverified 的数字（部分 VBD/AVBD 性能数、AVBD arXiv id 等，因 WebFetch 被拦）**不写进正文**或仅在能由本地代码佐证时写；本地代码事实以 Read 到的 file:line 为准。
- **不破坏原书**：只追加、不改写 Part 0–6 现有章节内容（除统一注入 widget 脚本清单这一机械改动）；改动前后用浏览器/静态检查确认原书章节仍正常。

---

## 9. 不做（YAGNI）

- 不逐行走读 Newton 全部 ~10k 行 kernel（概念优先）。
- 不深入 rigid AVBD 的 joint/contact 全部实现细节（仅 10-x 概览）。
- 不重写原书 Part 0–6 的既有讲解。
- 不新建独立子站（确认为「扩展现有这本书」）。
- 不引入构建工具/打包器（保持零构建）。

---

## 10. 交付物清单

- `learn/content.js`：+4 Parts +3 附录 section。
- `learn/chapters/07-newton-foundations/` (4) · `08-strand-to-cloth/` (5) · `09-elasticity-collision/` (3) · `10-avbd/` (2) = 14 新章节 HTML。
- `learn/chapters/appendix/a-4…a-6` = 3 附录 HTML。
- `learn/assets/js/widgets/`：`warp-launch.js`、`graph-coloring.js`、`parallel-sweep.js`、`cloth-lab.js`、`cloth-core.js`、`avbd-penalty-ramp.js`（5 widget + 1 core）。
- `learn/assets/css/book.css`：+teal 桥样式。
- `learn/_NEWTON_BRIEF.md`：FACTS 文档。
- 各章节底部 script 块更新（含原书章节回填，统一 widget 清单）。
