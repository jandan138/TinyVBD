# IPC 篇 章节写作 BRIEF + FACTS（给 Part 11 章节写作 agent）

你在为 **TinyVBD 交互式教程的「IPC 篇」**（Part 11 + 附录 a-7）写章节 HTML。
**先 Read 四个黄金参考**（语气 / HTML 用法 / widget 嵌入 / 数学讲法 / 对照桥）：
- `chapters/00-orientation/0-1-where-we-go.html`（语气、HTML、widget 嵌入）
- `chapters/01-foundations/1-2-variational-euler.html`（数学讲法、桥、公式密度）
- `chapters/09-elasticity-collision/9-3-collision.html`（**最重要的对照锚点**：Newton cloth 的 log-barrier + Coulomb friction + penetration-free 截断）
- `chapters/10-avbd/10-1-avbd-idea.html`（penalty / AVBD 的讲法与 callout/桥用法）
- 骨架：`_template.html`；导航源：`content.js`；底部脚本块：`_SCRIPT_BLOCK.html`（**新章节直接整段复制它**，已含全部新旧 widget）。
- 原 BRIEF：`_AGENT_BRIEF.md` / `_NEWTON_BRIEF.md`（HTML 规则一致，下面只列差异/新增）。

---

## 受众与语气（在原书 + Newton 篇受众之上）

- 读者**已读完 TinyVBD 原书 + Newton 篇**：吃透了 `min G(x)`、per-vertex `Δx = H⁻¹f`、Gauss-Seidel sweep、SPD 投影、高质量比稳定性，并且**已经在 9-3 见过 log-barrier 接触 + Coulomb friction + penetration-free 截断（DAT）**，在 **10-1 见过 penalty / AVBD（augmented Lagrangian + penalty ramping）**。
- 因此本篇**不重新解释什么是接触、什么是 barrier**——而是讲 **IPC 这条路和已学的两条（Newton cloth 的局部 barrier、AVBD 的 penalty ramping）差在哪、为什么 IPC 能给出严格 intersection-free 保证、代价在哪**。
- 中文叙述、娓娓道来、讲「为什么」；**英文保留所有架构/概念名**（IPC, interior-point, log-barrier, CCD, line search, intersection-free, PSD projection, CHOLMOD, Coulomb friction, augmented Lagrangian…）。
- 每节 `<p class="lede">` 导言开场；结尾小标题「这一节你要带走的」用**三句话**收束并预告下一节；目标 ~900–1500 中文字正文 + 公式/代码/callout/桥/（指定的）widget。

## 桥 + 对照（本篇主力是「接回已学」）

本篇几乎不用 GAMES103 桥。主力是把 IPC 接回读者已吃透的三处：
- **TinyVBD 桥（teal）**：接回主线 `min G(x)`——IPC 仍是最小化一个 incremental potential，只是接触项是 barrier。
  ```html
  <div class="bridge tinyvbd"><div class="c-h"><span class="tag">从 TinyVBD 看</span> 标题</div><p>…</p></div>
  ```
- **接回 9-3（log-barrier / penetration-free）**：用普通 `<div class="callout note">` 或正文链接 `<a href="../09-elasticity-collision/9-3-collision.html">9.3</a>`，反复对照「同样 barrier，但 Newton cloth 是 per-vertex 局部 + 几何截断兜底；IPC 是全局 Newton + CCD line-search 严格保证」。
- **接回 10-1（penalty / AVBD）**：PBD 桥（琥珀）`<div class="bridge pbd">` 或正文链接 `<a href="../10-avbd/10-1-avbd-idea.html">10.1</a>`，讲「penalty 软 / AVBD ramp 到硬 / IPC interior-point barrier」三条路。
- **接回 9-2（SPD 投影）**：IPC 的 barrier/elasticity Hessian 同样做 PSD projection，链接 `<a href="../09-elasticity-collision/9-2-spd-damping.html">9.2</a>`。

## 全篇主线一句话（反复用）

> **还是 `min G(x)`；IPC 把接触写成 interior-point log-barrier，并用 CCD-filtered line search 保证每一步都在可行域内——于是 intersection-free 不是「兜底」，而是「保证」。**

## HTML 规则（与原书一致，差异点）

- 复制黄金参考的 `<head>`/topbar/layout/search-overlay；**底部脚本块整段复制 `_SCRIPT_BLOCK.html`**（已含全部新旧 widget）。`data-root="../../"`，`data-section="X-Y"` 必须等于章节 id（如 `11-1`、`a-7`）。
- 每个 `<h2>/<h3>` 带唯一 `id`。术语 `<span class="term">English</span>`，强调 `<span class="term-i">italic</span>`。
- 代码块：IPC 是概念篇、**基本不贴代码**；若需伪代码/Python 风格用 `data-lang="python"`，TinyVBD 对照用 `data-lang="cpp"`：
  ```html
  <div class="code" data-lang="python"><div class="code-h"><span class="fn">pseudocode</span><button class="cp">复制</button></div><pre><code>...</code></pre></div>
  ```
  `<code>` 内 `&lt; &gt; &amp;` 必须转义。
- 数学：行内 `$...$`，行间 `<div class="math-block">$$...$$</div>`（KaTeX）。**直觉 + 关键公式，别堆代数**。barrier 精确解析式见下方 DO-NOT-STATE。
- callout：`<div class="callout note">`（提示）/ `<div class="callout warn">`（坑）。内部 `<div class="c-h">标题</div>` + `<p>`。
- 章节交叉引用用相对链接（按 content.js 的 file 路径）。

## Widget→章节 指派（每个只在指定章节用）

- `contact-three-ways` —— penalty / AVBD / IPC 三种接触在「物体压向地面」时的穿透深度对照。用于 **11-1**（开篇钩子）和 **11-7**（总对照）。
- `barrier-curve` —— barrier 能量 $b(d,\hat d)$ 及其力/Hessian 随距离 $d$ 的曲线，可叠加 penalty 对照、调 $\hat d$。用于 **11-2** 和 **11-3**（切距离类型/视图）。
- `ccd-linesearch` —— 一个点朝线段运动，CCD 求最大安全步长、line search 截到可行域内，点永远停在前面。用于 **11-4**。
- `friction-smooth` —— 光滑化摩擦力 vs 滑移速度曲线，对照理想 Coulomb 阶跃。用于 **11-5**。
- **11-6 不放 widget**（用 prose/math/桥讲求解器全景与代价）。

---

# 事实库（FACTS）—— 只用这里 + 你 Read 到的真实章节，别臆造数字

## A. IPC 论文与核心思想

- **论文**：*Incremental Potential Contact: Intersection- and Inversion-free, Large-Deformation Dynamics.* Minchen Li, Zachary Ferguson, Teseo Schneider, Timothy Langlois, Denis Zorin, Daniele Panozzo, Chenfanfu Jiang, Danny M. Kaufman. **ACM TOG (SIGGRAPH) 39(4), Art. 49, 2020**。项目页 `ipc-sim.github.io`。
- **核心定位**：primal **interior-point**（内点法）做接触。把 **log-barrier** 接触能量注入变分优化（即 `min G(x)`），定义在**每对 surface primitive**（point-triangle / edge-edge）上。
- **barrier 性质**（只描述性质，别贴权威等式）：barrier $b(d,\hat d)$ 作用于无符号距离 $d$；$\hat d$ 是用户给的**激活阈值**（距离 < $\hat d$ 才开始发力）。$d<\hat d$ 时能量非零、随 $d\to0$ **发散到无穷** → 可产生任意大接触力，于是距离**永远跨不过 0**。barrier 设计成 $C^2$（二次连续可微）以便进 Newton。
- **intersection-free 的真正来源**：不是「事后兜底」，而是**在整个非线性求解迭代中始终保持可行性**。customized Newton solver 的 **line search 用 filtered CCD**（continuous collision detection）求出**最大不穿透步长** + 一个 **CFL 式保守接触界**进一步限制步长。于是每个 time step 结束都 intersection-free，**与压缩/接触程度无关**。
- **friction（摩擦）**：在**同一个优化框架内**处理，不另起炉灶。用 **lagged potential**（把摩擦的法向力/接触集滞后一步固定住，使摩擦项变成可优化的光滑势）+ **alternating updates**（交替更新）提升几何精度。静-动摩擦过渡被**光滑化（mollified）**成可微，避免理想 Coulomb 的不连续阶跃。
- **求解器实现**：每次迭代是一个**全局稀疏 Newton 步**。elasticity Hessian + barrier Hessian 都做 **PSD projection**（保证下降方向）、并行装配成稀疏 **CSR**；用 **CHOLMOD**（编译时挂 MKL LAPACK/BLAS）做符号分解 + 并行数值分解；也试过 **AMGCL** 多重网格预条件求解器。
- **为什么稳但贵**（对照 VBD 的局部下降）：贵在三处——(1) 每步 **CCD**（全局连续碰撞检测，找最大安全步长）；(2) **全局**稀疏线性求解（不是 VBD 那种 per-vertex 3×3）；(3) $\hat d$ 收紧 / barrier 在接近处刚度极大 → 条件数差、Newton 迭代多。换来的是**严格 intersection-free + 大形变/极端压缩下的鲁棒**。

## B. 与本书已有内容的对照锚点（务必接回，这是本篇的灵魂）

| 维度 | 9-3 Newton cloth（已学） | 10-1 penalty / AVBD（已学） | 11 IPC（本篇） |
|------|------|------|------|
| 接触能量 | log-barrier（per-vertex 累加进 $f_i/H_i$） | penalty（软）/ AVBD ramp k | log-barrier（全局，interior-point） |
| 求解 | per-vertex VBD 局部牛顿步，按 color sweep | VBD/AVBD 局部下降 | **全局**稀疏 Newton |
| 无穿透 | log-barrier 软挡 + **penetration-free 截断（DAT）几何兜底** | penalty 不保证；AVBD 靠 ramp 逼近 | **CCD-filtered line search 严格保证** |
| 摩擦 | Coulomb friction | （rigid 侧）| lagged + 光滑化 Coulomb |
| Hessian | SPD 投影（9-2） | —— | PSD projection（同源思想） |
| 代价 | 便宜、可并行 | 便宜、可并行 | 贵（CCD + 全局解） |

- **反复强调**：IPC 和 9-3 用的是**同一个数学对象**（log-barrier），区别在「局部 + 几何截断兜底」vs「全局 + CCD line-search 严格保证」。读者已在 9-3 亲手见过 log-barrier，这里是把它**升级成有理论保证的形态**。
- **三条路**（11-1 / 11-7 主轴）：
  - **penalty**（软）：把穿透当能量压，理论上不保证零穿透。
  - **AVBD**（augmented Lagrangian + penalty ramping）：用 $\lambda$ + ramp 把 k 推向硬，逼近硬约束。
  - **IPC**（interior-point barrier + CCD line search）：可行域内迭代，**保证**每步 intersection-free。
  - 取舍：penalty/AVBD 便宜可并行、IPC 贵但有保证。**没有银弹**，按场景选。

## C. 后续工作（仅在 11-6 末尾或附录 a-7 作「进一步阅读」列举，不展开细节）

- **C-IPC**（Codimensional IPC, 2021，`ipc-sim.github.io/C-IPC`）：把 IPC 扩到任意 codimension（点/线/面/体）统一无穿透耦合。
- **Convergent IPC**（arXiv:2307.15908）：原 IPC 是离散约束模型、细化下不收敛；此工作在连续设定下重构 barrier 并给出可收敛离散化。
- **Affine Body Dynamics (ABD)**（arXiv:2201.10022）：在 IPC 框架上做刚硬材料的快速无穿透仿真。
- GPU / robotics 方向：如 Midas（arXiv:2210.00130）。
- 这些**只列举、不当 IPC 原文事实混写**。

## D. DO-NOT-STATE（未核对，别当事实写进正文）

- **IPC 的精确 barrier 解析式**：常见写法是 $b(d,\hat d) = -(d-\hat d)^2 \ln(d/\hat d)$（$d<\hat d$），但**若不 100% 确定就只描述性质**（$d<\hat d$ 激活、$d\to0$ 发散、$C^2$），不贴权威等式当定论。若要贴，标注「论文 Eq.（以 PDF 为准）」。
- **任何 IPC 性能数字**（每步耗时、网格/顶点规模、加速比、和某方法的倍数对比）——一律不写死。
- 不把 **C-IPC / ABD / Convergent IPC** 的细节当原 IPC 2020 的事实。
- 不臆造 Newton 引擎里「有没有 IPC 求解器」——Newton 的 particle/rigid 用 VBD/AVBD（见 9-3、10-x），**IPC 不在 TinyVBD/Newton 代码里**，本篇是算法/概念篇。

# 输出

直接 Write 指派给你的每个 HTML 文件到 content.js 指定路径（`chapters/11-ipc/11-Y-*.html`）。写完回报：写了哪些文件、用了哪个 widget、有无存疑事实。**只用本 BRIEF 的事实 + 你 Read 的真实章节；公式用 KaTeX；别臆造性能数字；遵守 DO-NOT-STATE；反复接回 9-3 / 10-1 做对照。**

---

# 【专家级扩充 ADDENDUM】（第二轮：系统详细 + 给出并拆解 barrier 解析式）

用户要求把 IPC 篇从"深入浅出"升级到"系统详细的专家级"，并**给出并逐因子拆解 barrier 解析式**——但全程保持通俗易懂、像老师手把手。下面是扩充章节要用到的**额外事实 + 讲法规范**。结构变成 10 章（见下方"扩充后章节"）。

## 讲法升级：从"叙述"到"手把手算一遍"

原书最像老师的是 **4-3（solve() 逐行解剖）**：贴一段代码 → 逐块对公式 → 用 `<code>` 把变量点到公式符号 → callout 解释"为什么这样写"。**新增的 worked-example（11-7）和 ipc-iteration（11-8）必须复刻这个手法**：
- 先 Read `chapters/04-code/4-3-solve.html` 把它的节奏吃透。
- worked-example：用**具体数字**把一个接触对从距离算到 Δx，每一步都有中间数值，读者能拿计算器复算。
- ipc-iteration：贴**伪代码**（`data-lang="python"`，标注 pseudocode 非真实代码），逐段配公式与解释，像 4-3 那样"手指点到每一行"。

## barrier 解析式（现在要给出并拆解，带标注）

给出 IPC 论文采用的**常见 barrier 形式**（务必加标注，不冒充唯一权威）：
$$b(d,\hat d) = -(d-\hat d)^2 \,\ln\!\Big(\frac{d}{\hat d}\Big),\qquad 0<d<\hat d;\qquad b=0,\ d\ge\hat d.$$
**逐因子拆解（讲物理/数学含义）：**
- $\ln(d/\hat d)$：当 $d\to0^+$，$\ln(d/\hat d)\to-\infty$，前面负号让 $b\to+\infty$——**这是发散（不穿透）的来源**。$d=\hat d$ 时 $\ln 1=0$，能量归零。
- $(d-\hat d)^2$：一个在 $\hat d$ 处**二阶为零**的乘子。它的作用是让 $b$ 在激活边界 $d=\hat d$ 处**光滑接零**——$b(\hat d)=0$、$b'(\hat d)=0$、$b''(\hat d)=0$（值、一阶、二阶都连续到 0），从而整体 $C^2$。没有它，barrier 在 $\hat d$ 处会有折角，Newton 不友好。
- 两者相乘：靠 $\ln$ 在 $0$ 端发散、靠 $(d-\hat d)^2$ 在 $\hat d$ 端平滑收尾，合成一条"内陡外平、处处二阶光滑"的墙。
- **必须加的标注**（用 `<div class="callout note">`）：「这是 IPC 论文采用的常见形式，用于讲清三个因子各自的作用；精确定义、单位约定与可能的分段以论文 PDF（Li et al. 2020, Eq.）为准。换一个满足『$d\to0$ 发散、$d=\hat d$ 处 $C^2$ 接零』的函数，IPC 的结论不变——重要的是这三条性质，不是这一个式子。」
- 力 $b'(d)$ 与 Hessian $b''(d)$：可由上式求导得到（$d<\hat d$ 时 $b'(d)=-2(d-\hat d)\ln(d/\hat d)-(d-\hat d)^2/d$）。讲解时**重点在符号与趋势**（$b'<0$ 即力把距离往增大方向推、$d\to0$ 时 $|b'|\to\infty$），不必让读者死记导数式；可作为"想自己验证就照着求"的附注。

## 距离梯度 ∂d/∂x（标准几何，可详讲）

这是 11-3 的核心、原版被一句话带过的部分。**point-triangle 距离**：顶点 $p$ 到三角形 $(a,b,c)$ 的最近点 $q$。
- 最近点 $q$ 落在三角形上，可写成 barycentric 组合 $q=\lambda_a a+\lambda_b b+\lambda_c c$，$\lambda_a+\lambda_b+\lambda_c=1$。
- 无符号距离 $d=\lVert p-q\rVert$；其梯度方向是**单位法向** $\hat n=(p-q)/d$。
- 梯度按链式法则落到 4 个顶点：对 $p$ 是 $\partial d/\partial p=\hat n$；对三角形三个顶点是 $\partial d/\partial a=-\lambda_a\hat n$（同理 $b,c$）——**权重就是 barycentric 系数**，"谁离最近点近，谁分到的梯度大"。这给读者一个非常直观的画面。
- **退化/分区情形**（务必提，体现"系统"）：最近点可能不落在三角形内部，而落在某条**边**上（退化成 point-edge）或某个**顶点**上（退化成 point-point）。落在哪个区由 barycentric 坐标的符号决定（某个 $\lambda<0$ 说明越界，需投影到对应边/顶点）。IPC 的距离例程要分这些 case，这是实现里真正磨人的地方。
- **edge-edge 距离**：两条线段 $(a_1,b_1)$、$(a_2,b_2)$ 上各取一点求最近距离；同样有"最近点落在线段内部 vs 端点"的分区；**退化情形**是两边接近**平行**——此时最近点对不唯一、梯度病态，IPC 用 mollifier（一个随平行程度衰减的权重）把这种退化情形的贡献平滑压住，避免数值抽风。可作为 callout warn 点出。

## worked-example 数字剧本（11-7，给 agent 一组自洽的数）

用一个 **2D point-segment**（point-triangle 在 2D 的类比，便于读者手算）做例子，全程用这组数，保证自洽：
- 点 $p=(0.0,\ 0.30)$，线段从 $a=(-1,0)$ 到 $b=(1,0)$。最近点 $q=(0,0)$，落在线段内部，barycentric $\lambda_a=\lambda_b=0.5$。
- 无符号距离 $d=0.30$；单位法向 $\hat n=(0,1)$。
- 取 $\hat d=0.40$、$\kappa=1$。代入常见 barrier：$d<\hat d$ 激活。讲解时**展示代入过程与中间值的量级/符号**（$d/\hat d=0.75$，$\ln 0.75\approx-0.288$，$(d-\hat d)^2=0.01$，故 $b\approx-0.01\times(-0.288)\approx 2.9\times10^{-3}$），强调"这只是把性质落到数字上"，并再次标注解析式以论文为准。
- 力方向：$-b'(d)\,\hat n$，沿 $+\hat n=(0,1)$ 把点往外推（远离线段）；$d$ 越小这股力越大。
- 落到顶点：点 $p$ 受 $+\hat n$ 方向力；线段两端各受 $-0.5\,\hat n$（barycentric 权重 0.5）。
- Hessian → PSD 投影 → 与惯性/弹性合成 → 这一步 $\Delta x$ 的**方向**（把点抬离线段）。数值可定性，不必精确到小数（避免臆造），重点是**每一步都接得上、符号和方向对**。
- **诚实声明**：worked example 的具体数字是为讲解构造的自洽示例，非论文复现；barrier 解析式按上面标注。

## 扩充后章节（10 章，重编号）

1. **11-1** why-ipc（保留）— widget contact-three-ways
2. **11-2** barrier-energy（**加厚**：加解析式逐因子拆解 + 标注）— widget barrier-curve
3. **11-3** distance-geometry（**新增**：point-triangle/edge-edge 距离几何 + ∂d/∂x barycentric 落点 + 退化分区）— widget `distance-gradient`
4. **11-4** barrier-grad-psd（**新增**：链式法则 force/Hessian 两项 + 距离二阶项不保 PSD + PSD projection 钳特征值，接回 9.2）— widget barrier-curve 复用
5. **11-5** ccd-linesearch（保留，原 11-4）— widget ccd-linesearch
6. **11-6** friction（保留，原 11-5）— widget friction-smooth
7. **11-7** worked-example（**新增**：上面的数字剧本，仿 4-3 手把手算一遍）— widget distance-gradient 复用
8. **11-8** ipc-iteration（**新增**：一次 IPC 外迭代伪代码逐段走读，仿 4-3）— widget `ipc-loop`
9. **11-9** solver-cost（保留，原 11-6）— 无 widget
10. **11-10** three-roads（保留，原 11-7）— widget contact-three-ways 复用

## 新增 widget（2 个）

- **`distance-gradient`**（11-3、11-7）：2D point-segment。拖动点，画最近点 $q$、无符号距离 $d$、梯度箭头 $\partial d/\partial p=\hat n$（在点上）与 $-\lambda\hat n$（在两端点上，长度按 barycentric 权重）；当最近点滑到端点时高亮"退化成 point-point"。worked-example 里把点固定在 $(0,0.3)$ 复用此 widget。
- **`ipc-loop`**（11-8）：一次外迭代流水线动画。横向分阶段：assemble H/f → PSD-project → solve direction p → CCD t* → line-search α → accept。高亮当前阶段，右侧一个点-墙小场景同步显示"提出的 full step（虚线，可能穿墙）vs 截断后实际 α 步（实线，停墙前）"。提供"单步 / 自动"按钮（用 VBW 工具，不用 Math.random/Date.now）。

## DO-NOT-STATE（更新）

- barrier 解析式：**现在可以给出**常见形式，但**必须显式标注**"论文采用的常见形式、精确以 PDF 为准、关键是三条性质而非这一个式子"。不声称它是唯一权威定义、不抠论文里精确的单位/分段常数。
- worked-example 数字：标注为"为讲解构造的自洽示例，非论文复现"。
- 距离梯度的 barycentric 落点、退化分区、edge-edge 平行 mollifier：是标准计算几何，可讲；但不要把某个具体实现的 case 分支细节当 IPC 论文原话。
- 仍然：不写任何 IPC 性能数字；不声称 IPC 在 TinyVBD/Newton 代码里。
