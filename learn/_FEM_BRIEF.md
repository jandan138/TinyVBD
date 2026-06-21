# FEM 篇 章节写作 BRIEF + FACTS（给新 Part 9 章节写作 agent）

你在为 **TinyVBD 交互式教程的「FEM 篇」**（**新 Part 9**，`chapters/09-fem/`）写章节 HTML。这是一本零构建、book-like、通俗易懂的中文物理仿真教程，主线是「一切都是 `min G(x)`」。

## ⚠️ 编号背景（务必知道）

本书刚做过一次重编号。**当前编号**（你写的链接必须用这个）：
- **Part 9 = FEM 篇（你正在写的，`chapters/09-fem/9-1..9-6`）**——连续介质弹性的地基。
- **Part 10 = 真实弹性与碰撞**（`chapters/10-elasticity-collision/`）：`10-1` Neo-Hookean membrane/volumetric、`10-2` SPD 投影与 Rayleigh damping、`10-3` self-collision。**这是「应用 FEM」——它已经在用 $F$、$\psi(F)$、Piola 应力，但从没讲地基。FEM 篇正是给它补地基。**
- Part 11 = AVBD（`11-avbd/`），Part 12 = IPC（`12-ipc/`），Part 13 = MPM（待写），附录 `a-x`。
- 前置：Part 1 数学地基（`1-4` 弹簧能量是弹性项的最简形式），Part 3 VBD 核心，Part 8 strand→cloth。

## 先 Read 这些黄金参考（语气 / HTML / 数学讲法 / worked example）

- `chapters/01-foundations/1-2-variational-euler.html`（数学讲法、桥、公式密度）
- `chapters/01-foundations/1-4-spring-energy.html`（弹簧能量→力→Hessian 的推导节奏；FEM 是它的连续介质推广）
- `chapters/04-code/4-3-solve.html`（逐行/逐数走读手法）
- `chapters/12-ipc/12-7-worked-example.html`（**代具体数字手把手算一遍**的标杆——FEM 篇 9-5 必须照这个做）
- `chapters/10-elasticity-collision/10-1-elastic-elements.html`（**本篇要补地基的对象**：看它已经怎么用 $F$/$\psi$/$P$）
- 骨架：`_template.html`；导航源：`content.js`；底部脚本块：`_SCRIPT_BLOCK.html`（**新章直接整段复制它**，已含全部 widget）。

## 受众与语气

- 读者已读完原书 + Newton 篇 + IPC 篇：吃透 `min G(x)`、per-vertex 牛顿步 $\Delta x=H^{-1}f$、弹簧能量/力/Hessian、SPD 投影；**已在 10-1 见过 Neo-Hookean 元件在用 $F$、$\psi$、Piola，但不知道它们从哪来**。
- 中文叙述、娓娓道来、讲「为什么」；**英文保留概念名**（FEM, deformation gradient, strain energy density, first Piola-Kirchhoff stress, hyperelastic, Neo-Hookean, StVK, co-rotational, polar decomposition, constant-strain, shape function…）。
- 每节 `<p class="lede">` 导言开场；结尾 `<h2 id="takeaway">这一节你要带走的</h2>` 三句话收束 + 预告下一节相对链接；目标 ~1000–1600 中文字 + 公式/桥/callout/（指定）widget。

## 全篇主线一句话（反复用）

> **还是 `min G(x)`，弹性项 $\Psi(x)$ 没变本质——只是从弹簧的 $\tfrac12k(l-l_0)^2$（标量、1 自由度）推广成连续介质的 $\int_\Omega \psi(F)\,dV$（张量、整块材料）。FEM = 把这块积分离散成一个个单元，每个单元一个常数 $F$。**

## 桥与对照（务必接回）

- **TinyVBD 桥（teal）**：接回 `1-4` 弹簧——「弹簧是 1 维的 FEM 单元：它的『形变』就是长度比 $l/l_0$，能量 $\tfrac12k(l-l_0)^2$；FEM 把『长度比』升级成形变梯度 $F$，把标量能量升级成 $\psi(F)$」。
  ```html
  <div class="bridge tinyvbd"><div class="c-h"><span class="tag">从 TinyVBD 看</span> 标题</div><p>…</p></div>
  ```
- **接回 Part 10（应用 FEM）**：反复点明「你在 `10-1` 见过的 Neo-Hookean membrane/volumetric，正是这套 FEM 地基的应用；`10-2` 的 SPD 投影正是 FEM 单元 Hessian 不定时的修复」。用普通链接 `<a href="../10-elasticity-collision/10-1-elastic-elements.html">10.1</a>`、`<a href="../10-elasticity-collision/10-2-spd-damping.html">10.2</a>`。

## HTML 规则（与全书一致）

- 复制黄金参考的 `<head>`/topbar/layout/search-overlay；**底部脚本块整段复制 `_SCRIPT_BLOCK.html`**。`data-root="../../"`，`data-section="9-Y"` 必须等于章节 id。`.eyebrow` = `Part 9 · 9-Y`。
- 每个 `<h2>/<h3>` 唯一 `id`。术语 `<span class="term">English</span>`，强调 `<span class="term-i">`。
- 数学：行内 `$...$`、行间 `<div class="math-block">$$..$$</div>`（KaTeX）。直觉先于公式，别堆代数。
- callout：`<div class="callout note">`/`<div class="callout warn">`，内 `<div class="c-h">标题</div>` + `<p>`。
- 代码/伪代码（少用）：`<div class="code" data-lang="python">…<pre><code>…</code></pre></div>`，`<` 转义 `&lt;`。
- worked example 标注「为讲解构造的自洽示例，材料/单位会整体缩放量级」。

## 章节结构（6 章）

| id | 文件 | 主题 | widget |
|----|------|------|--------|
| 9-1 | `9-1-why-fem.html` | 为什么需要 FEM：弹簧只有 1 个自由度（长度），抓不住剪切、面积/体积变化、各向异性；真实材料要连续介质。弹性项 $\Psi$ 从 $\sum\tfrac12k(l-l_0)^2$ 推广到 $\int\psi(F)dV$。接 `1-4`，预告 `10-1` Neo-Hookean | 无（或复用 `spring-hessian`/`strain-energy-models`）|
| 9-2 | `9-2-deformation-gradient.html` | **形变梯度 $F$**：把 rest 形状 $X$ 映到 world 形状 $x$ 的局部线性化 $F=\partial x/\partial X$；三角形/四面体单元上 $F$ 是常数（constant-strain）；怎么从顶点坐标算 $F=D_s D_m^{-1}$；极分解 $F=RS$（旋转+拉伸）；$J=\det F$ 是体积/面积比 | `deformation-gradient-tri`（新）|
| 9-3 | `9-3-strain-energy.html` | **应变能密度 $\psi(F)$ 与超弹性模型谱**：能量只依赖 $F$（hyperelastic）；不变量 $I_C=\mathrm{tr}(F^TF)$、$J$；模型对照——StVK（$\psi=\mu\|E\|_F^2+\tfrac\lambda2\mathrm{tr}(E)^2$，$E=\tfrac12(F^TF-I)$，**压缩区反转灾难**）、co-rotational（去掉旋转只惩罚 $S-I$）、Neo-Hookean（stable 版 Smith 2018，本书 10-1 用的就是它）。各自的坑 | `strain-energy-models`（新）|
| 9-4 | `9-4-piola-assembly.html` | **第一 Piola-Kirchhoff 应力 $P=\partial\psi/\partial F$**；单元力 $f=-\partial(\text{单元能量})/\partial x=-V_0\,P\,D_m^{-\top}$（按 $\partial F/\partial x$ 把 $P$ 分配到各节点）；装配进每顶点 $f_i/H_i$（同 VBD 的口）；单元 Hessian 不保正定 → **SPD 投影**（接 `10-2`）| `element-assembly`（新）|
| 9-5 | `9-5-worked-tet.html` | **手把手算一遍**（仿 `12-7`）：一个具体三角形单元，rest=单位直角三角形，world=均匀拉伸 10%，代数字：$D_m,D_s\to F\to J\to I_C\to\psi\to P\to$ 各节点力 $\to\Delta x$ 方向。每步写中间值能复算 | 复用 `deformation-gradient-tri` |
| 9-6 | `9-6-fem-is-minG.html` | **「FEM 就是 $\min G(x)$ 的弹性项」**：把单元能量求和 $\Psi=\sum_e V_0^e\psi(F^e)$ 放回 $G(x)=\text{惯性}+\Psi$；VBD/Newton 怎么解它（每顶点收集邻接单元的 $f/H$，和弹簧一模一样的装配口）；`10-1` 正是这套地基在 Newton 里的落地；参考文献入口（→ a-8）| 无 |

**给已顺延的 `10-1-elastic-elements.html` 补一句前向/回指**（在它开头 lede 或第一个 bridge 里）：「这些元件的连续介质地基——$F$、$\psi(F)$、Piola 应力、单元装配——见 <a href="../09-fem/9-1-why-fem.html">Part 9 FEM 篇</a>」。（这条由主控做或单独指派，不在本批必须。）

## Widget 指派

- `deformation-gradient-tri`（9-2、9-5）、`strain-energy-models`（9-3）、`element-assembly`（9-4）。其余章用 prose/math/桥/worked-example。

## FACTS（标准连续介质力学，已核对，可详讲）

- **形变梯度**：$F=\partial x/\partial X$。三角/四面体单元用边矩阵：rest 边矩阵 $D_m=[X_1-X_0,\dots]$、world 边矩阵 $D_s=[x_1-x_0,\dots]$，则 $F=D_s D_m^{-1}$（常数，constant-strain）。$J=\det F$：3D 体积比、2D 面积比；$J<0$ = 单元翻转（inverted）。
- **极分解** $F=RS$：$R$ 正交（旋转）、$S$ 对称正定（纯拉伸）。刚体旋转不该产生能量 → 好的能量只依赖 $S$（或 $F^TF$）。
- **应变度量**：Green-Lagrange $E=\tfrac12(F^TF-I)$（rotation-invariant）。小应变近似 $\varepsilon=\tfrac12(F+F^T)-I$（线弹性用，大转动会假）。
- **超弹性能量 $\psi(F)$**（只依赖 $F$、rotation-invariant）：
  - **StVK**：$\psi=\mu\,\|E\|_F^2+\tfrac\lambda2\,(\mathrm{tr}\,E)^2$。简单，但**压缩到反转附近能量反而下降 → 单元会被压穿、翻面不回弹**（著名坑，要讲）。
  - **co-rotational**：$\psi=\mu\|S-I\|_F^2+\tfrac\lambda2(\mathrm{tr}(S-I))^2$（或等价用 $F-R$）。先抽掉旋转 $R$ 再线性惩罚拉伸，大转动稳、压缩比 StVK 好。
  - **Neo-Hookean（stable, Smith 2018）**：$\psi=\tfrac\mu2(I_C-3)-\mu\ln J+\tfrac\lambda2(\ln J)^2$（或本书 10-1 用的 $\tfrac\mu2(I_1-3-2\ln J)+\tfrac\lambda2(J-1)^2$ 变体）；$\ln J$/$1/J$ 项在 $J\to0$ 发散 → **抗反转**。这是 production 标准，本书 10-1 已用。
  - Lamé 参数 $\mu,\lambda$ 与杨氏模量 $E$、泊松比 $\nu$ 互换：$\mu=\tfrac{E}{2(1+\nu)}$、$\lambda=\tfrac{E\nu}{(1+\nu)(1-2\nu)}$。
- **应力与力**：第一 Piola-Kirchhoff $P=\partial\psi/\partial F$。单元（constant-strain，体积 $V_0$）能量 $=V_0\psi(F)$；对节点位置求导得节点力，可写成 $H=V_0\,P\,D_m^{-\top}$（$H$ 的列是作用在 $x_1,x_2,\dots$ 上的力，$x_0$ 取负和）。**力的梯度进 $f_i$、Hessian（$\partial^2\psi/\partial F^2$ 经 $\partial F/\partial x$）进 $H_i$，和弹簧一样累加进同一个口**。
- **单元 Hessian 不定**：和压缩弹簧一样，$\partial^2\psi/\partial x^2$ 在压缩/接近反转时可能有负特征值 → **SPD projection**（特征值钳到 $\ge0$），正是本书 `10-2` 讲的操作。FEM 篇要点明「10-2 的 SPD 投影就是为 FEM 单元 Hessian 服务的」。
- **constant-strain 单元**：线性 shape function ⇒ 单元内 $F$ 常数 ⇒ 一个单元一个 $P$、一份力。三角形（2D 膜）$F$ 是 3×2 或 2×2；四面体（3D 体）$F$ 是 3×3。

## DO-NOT-STATE / 纪律

- worked example 的具体数标「自洽示例、非论文复现」；绝对能量量级随 $\mu,\lambda$、单位缩放，只对**符号、方向、趋势、$J$/不变量**较真。
- 不写未核对性能数字。
- 公式用上面 FACTS 的标准形式即可（连续介质力学是成熟领域，可作为定论讲）；Neo-Hookean 的精确变体以本书 10-1 already 用的为准、可标「stable NH，Smith 2018」。
- 不把 FEM 说成「TinyVBD 代码里有」——TinyVBD strand 只有弹簧；FEM 单元在 Newton 的 cloth/soft-body（10-1）里。本篇是 engine-agnostic 的地基讲解。

## 输出

直接 Write 指派的每个 `chapters/09-fem/9-Y-*.html`。回报：写了哪些文件、用了哪个 widget、有无存疑。**接回 1-4 与 10-1/10-2；公式用 KaTeX；worked example 仿 12-7；别臆造数字。**
