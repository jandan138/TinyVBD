# 章节写作 BRIEF（给章节写作 agent）

你在为 **TinyVBD 交互式教程**写章节 HTML。先 Read 两个黄金参考：
- `chapters/00-orientation/0-1-where-we-go.html`（语气、HTML 用法、widget 嵌入）
- `chapters/01-foundations/1-2-variational-euler.html`（数学讲法、桥、公式密度）
- 骨架模板：`_template.html`；导航源（所有章节 id/title/file/顺序）：`content.js`

## 受众与语气
- 读者：上过 **GAMES103**、写过弹簧质点；对 **PBD** 的理解只停留在「把粒子位置粗暴掰到约束上、反复迭代」；对**隐式欧拉背后的数学本质有点发虚**。
- 中文叙述，**娓娓道来、有"为什么"**，不流水账、不堆代数。用 GAMES103 / PBD 的直觉切入。
- **英文保留所有架构术语、命令名、性能指标、概念名**（VBD, Gauss-Seidel, incremental potential, Hessian, compliance, Chebyshev…）。符合论文阅读习惯。
- 每节开头一句 `<p class="lede">` 导言；结尾用一个小标题（如「这一节你要带走的」）收束并预告下一节。
- 每节目标 **~900–1500 字中文正文** + 合适的公式 / 代码 / callout / 桥 /（指定的）widget。

## HTML 规则（务必遵守）
1. 每个文件是完整 HTML，**完整复制参考文件的 `<head>`、topbar、layout、search-overlay、底部 script 块**。只改：`<title>`、`data-section="X-Y"`、`.eyebrow`、`<h1>`、`<p class="lede">` 和正文。
2. `data-root="../../"` 对所有 `chapters/<dir>/*.html` 都适用（两级深度）。
3. **不要手写 prev/next 和侧栏**——book.js 用 content.js 自动生成。`<nav id="sidebar">`、`<aside id="rail">` 留空。
4. **每个 `<h2>`/`<h3>` 必须带唯一 `id`**（右栏 scroll-spy 依赖）。
5. 术语：`<span class="term">English</span>` 高亮英文术语/命令/类名；`<span class="term-i">italic</span>` 强调。
6. 代码块（C++ 用 `data-lang="cpp"`）：
   ```html
   <div class="code" data-lang="cpp"><div class="code-h"><span class="fn">Strand.h</span><button class="cp">复制</button></div><pre><code>...原样代码...</code></pre></div>
   ```
   `<code>` 内 `&lt; &gt; &amp;` 必须转义（C++ 模板的 `<>` 尤其注意）。高亮由 book.js 做。
7. 数学：行内 `$...$`，行间 `<div class="math-block">$$...$$</div>`（KaTeX）。**直觉 + 关键公式 + 推导要点，别堆满代数**。
8. callout：`<div class="callout note">`（提示）/`<div class="callout warn">`（坑）/`<div class="callout">`（中性）。内部 `<div class="c-h">标题</div>` + `<p>`。
9. **两座桥**（引入新概念时多用）：
   - GAMES103 桥（紫）：`<div class="bridge g103"><div class="c-h"><span class="tag">从 GAMES103 看</span> 标题</div><p>…</p></div>`
   - PBD 桥（琥珀）：`<div class="bridge pbd"><div class="c-h"><span class="tag">从 PBD 看</span> 标题</div><p>…</p></div>`
10. 表格用普通 `<table>`。章节交叉引用用相对链接，如 `<a href="../01-foundations/1-2-variational-euler.html">1.2</a>`（按 content.js 的 file 路径）。

## 交互部件（widget）
所有部件脚本已在底部 script 块加载。需要时这样嵌入：
```html
<div class="lab">
  <div class="lab-h"><span class="lab-tag">interactive</span><span class="lab-t">标题</span></div>
  <div class="lab-body" data-widget="WIDGET_NAME"></div>
  <div class="lab-cap">一句说明怎么玩 / 看什么。</div>
</div>
```
**部件与章节的指派（每个部件只在指定章节用）**：
- `strand-lab` —— 实时可拖动的 VBD strand 仿真器。用于 **0-1（开篇钩子）** 和 **5-4（capstone 游乐场）**。
- `euler-stability` —— explicit/implicit/symplectic Euler 稳定性对比。用于 **1-1**。
- `potential-landscape` —— G(x) 山谷热力图，惯性碗 vs 弹性环的拔河。用于 **1-2**。
- `spring-hessian` —— 单弹簧的 E/f/H 与特征值（压缩→不定）。用于 **1-4**。
- `pbd-stiffness` —— PBD 刚度随迭代漂移 vs XPBD 稳定。用于 **2-2**。
- `vbd-sweep` —— 慢动作逐顶点 Gauss-Seidel，看 f_i/H_i 与 G 单调下降。用于 **3-1**。
- `chebyshev` —— 收敛曲线，加/不加 Chebyshev，调 ρ 看 overshoot。用于 **4-4**。
- `mass-ratio` —— 高质量比下 VBD vs PBD-style 并排。用于 **5-1**。
其他章节没有指定 widget 就别放（用 prose/code/math/桥）。

---

# 事实库（FACTS）—— 只用这里 + 你 Read 到的真实代码，不要臆造数字

## 项目本体
- TinyVBD = SIGGRAPH 2024 论文 **Vertex Block Descent**（arXiv:2403.06321；Anka He Chen, Ziheng Liu, Yin Yang, Cem Yuksel；ACM TOG 43(4) Art.116）的极简 demo，**只做 mass-spring strand（一根「头发/绳」）**。
- 文件：`main.cpp`（仿真器 + 主循环 + IO）、`Strand.h`（数据结构 VBDStrand : Mesh）、`Types.h`（Eigen typedef、宏、assert）、`json.hpp`（nlohmann，仅 IO）、`VisualizeStrand.blend`（把输出 JSON 转 obj 可视化）、`CMakeLists.txt`、`README.md`。唯一依赖 **Eigen3**。
- 运行后把每帧顶点位置写成一串 JSON（`A00000001.json` …，字段 `pos`）到 `outPath`，再用 blend 文件可视化。
- 默认跑 `initializeTilted()` 的 **high mass ratio** 实验。`initialize()` 里可切到 `initializeStiffRatio()`；很多其它 config 在源码里以注释形式给出，取消注释即可试。

## 核心数学（全书统一记号，h = 时间步 dt）
- **隐式（backward）欧拉一步 = 最小化增量势能**：
  $$\mathbf{x}^{t+1} = \arg\min_{\mathbf{x}} G(\mathbf{x}),\quad G(\mathbf{x}) = \frac{1}{2h^2}\lVert\mathbf{x}-\mathbf{y}\rVert_M^2 + E(\mathbf{x})$$
- **惯性/预测位置（inertia y）**：$\mathbf{y} = \mathbf{x}^t + h\mathbf{v}^t + h^2\mathbf{a}_{ext}$（$\mathbf a_{ext}$=重力等外部加速度）。
- 这个等价关系来自 **Liu et al. 2013（Fast Simulation of Mass-Spring Systems）/ Martin et al. 2011**。注意 $1/(2h^2)$ 因子和「$E$ 乘 $h^2$」是同一回事（只差整体常数），别让读者困惑。
- **VBD 的解法 = block coordinate descent**：一次只动一个顶点 $i$ 的 3 个自由度（其余固定），对它的局部能量
  $$G_i(\mathbf x)=\frac{m_i}{2h^2}\lVert\mathbf x_i-\mathbf y_i\rVert^2+\sum_{j\in\mathcal F_i}E_j(\mathbf x)$$
  做**一步牛顿**：$\Delta\mathbf x_i = \mathbf H_i^{-1}\mathbf f_i$，然后 $\mathbf x_i\mathrel{+}=\Delta\mathbf x_i$。按 Gauss-Seidel 顺序扫过所有顶点。
- **顶点力（负梯度）**：$\mathbf f_i = -\frac{m_i}{h^2}(\mathbf x_i-\mathbf y_i) - \sum_{j\in\mathcal F_i}\frac{\partial E_j}{\partial \mathbf x_i}$
- **顶点 Hessian（3×3）**：$\mathbf H_i = \frac{m_i}{h^2}\mathbf I + \sum_{j\in\mathcal F_i}\frac{\partial^2 E_j}{\partial\mathbf x_i^2}$。第一项是恒正定的惯性项。
- **为什么「局部下降=全局下降」**：动一个顶点只影响它邻接的 force elements；论文证明「单顶点移动带来的 $G_i$ 下降 = 它带来的全局 $G$ 下降」。所以每个局部牛顿步保证全局能量单调下降 → 收敛、无条件稳定。
- **弹簧能量/力/Hessian**（mass-spring，rest length $l_0$，stiffness $k$，$\mathbf d=\mathbf x_a-\mathbf x_b$，$l=\lVert\mathbf d\rVert$）：
  - $E=\tfrac12 k(l-l_0)^2$
  - 力（对端点 a）：$\mathbf f = k\frac{l_0-l}{l}\mathbf d$（对 b 取负号）
  - Hessian：$\mathbf H_{aa}=k\big[\mathbf I-\tfrac{l_0}{l}(\mathbf I-\tfrac{\mathbf d\mathbf d^\top}{l^2})\big]$。沿弹簧方向特征值 $=k$；垂直方向 $=k(1-l_0/l)$，**压缩($l<l_0$)时为负 → H 不定**。这正是代码里 `h_1_1` 的形式。
- **Chebyshev semi-iterative 加速**（Wang 2015）：在每次完整 Gauss-Seidel 迭代后做一次
  $$\mathbf x^{(n)}=\omega_n(\bar{\mathbf x}^{(n)}-\mathbf x^{(n-2)})+\mathbf x^{(n-2)}$$
  递推 $\omega_1=1,\ \omega_2=\frac{2}{2-\rho^2},\ \omega_n=\frac{4}{4-\rho^2\omega_{n-1}}$。$\rho\in(0,1)$ 是迭代矩阵谱半径的**估计值**（手调或自动）。$\rho$ 太大 → overshoot/振荡甚至发散。代码里 `getAcceleratorOmega` / `applyAccelerator` 正是这个，`prevprevPos`=$\mathbf x^{(n-2)}$。论文常用 $\rho\approx0.93\!-\!0.95$。
- **自适应初始化**（论文 Eq.17，对应 `forwardStep` 里的 `accelerationComponent` 逻辑）：初始猜测 $\mathbf x=\mathbf x^t+h\mathbf v^t+h^2\tilde a\,\mathbf a_{ext}$，标量 $\tilde a$ 由「上一帧加速度在重力方向的投影」决定：自由下落的顶点 $\tilde a\approx1$（猜测带上完整重力），被弹力/接触托住的顶点 $\tilde a\approx0$（停在原位，避免把叠放物体初始化成穿插的自由下落态）。比单纯用惯性位置或 PBD 式初始化都好。**VBD 不强制某种初始化（XPBD 强制），这是它能做自适应初始化的前提。**

## 谱系（PBD / XPBD / PD / VBD 都在解同一个 min G(x)）
- **PBD（Müller 2007）**：predict $\mathbf x^*=\mathbf x+h\mathbf v+h^2\mathbf f_{ext}/m$；然后对每个约束 $C(\mathbf x)=0$ 顺序投影（Gauss-Seidel）：$\Delta\mathbf x_i=-s\,w_i\nabla_i C$，$s=C/\sum_j w_j\lVert\nabla_j C\rVert^2$，$w_i=1/m_i$；最后 $\mathbf v=(\mathbf x-\mathbf x_{old})/h$。**病**：刚度依赖迭代次数与时间步，不收敛到良定义解（"stiffness 是 solver 设置的产物，不是物理量"）。
- **XPBD（Macklin 2016）**：引入 **compliance** $\alpha=1/k$ 与 Lagrange multiplier $\lambda$，$\tilde\alpha=\alpha/h^2$，
  $$\Delta\lambda=\frac{-C-\tilde\alpha\lambda}{\sum_j w_j\lVert\nabla_j C\rVert^2+\tilde\alpha},\quad \Delta\mathbf x_i=w_i\nabla_i C\,\Delta\lambda,\quad \lambda\mathrel{+}=\Delta\lambda$$
  让刚度变成**时间步/迭代无关**的物理量；$\alpha\to0$（无穷硬）退回 PBD。本质是隐式欧拉 KKT 系统的 Gauss-Seidel。
- **Projective Dynamics（Bouaziz 2014 / Liu 2013）**：把 $E$ 写成特殊二次型 $\sum\frac{w}{2}\lVert A_iS_i\mathbf q-B_i\mathbf p_i\rVert^2$，**local/global** 交替：local 步对每个约束做投影（并行），global 步解一个**矩阵恒定、可预分解（Cholesky）的线性系统**。快，但只能表达这种特殊二次能量；线性收敛；改连通性（撕裂）要重分解。
- **VBD 的卖点（相对 XPBD）**：XPBD 是**约束近似**、用近似 Hessian（只留惯性项），大 $h$/少迭代会偏离隐式欧拉解；VBD 直接**最小化真正的增量势能** $G$、保留完整局部 Hessian、单调下降。XPBD 是 **dual**（对偶/约束力）求解器，**高质量比**会崩（修正按逆质量分配，重物压垮轻物）；VBD 是 **primal**（直接解位置），高质量比无压力。VBD 用**顶点图着色**（颜色数远少于 XPBD 的约束/对偶图着色）拿到 Gauss-Seidel 收敛 + 近 Jacobi 并行。
- **VBD 的局限（诚实交代）**：是局部下降法，信息每步只传播 ~(#颜色×#迭代) 远，**高分辨率超硬系统**不理想（Newton 可能更优）；**高刚度比**（如 1:10000）收敛差（论文 Fig.23）；惩罚式碰撞不保证无穿透。后续 **AVBD（Augmented VBD, SIGGRAPH 2025）** 用增广拉格朗日补上硬约束与高刚度比。

## TinyVBD 代码事实（务必 Read 真实文件核对；忽略 json.hpp 内部）
- `Types.h`：`FloatingType=float`；Eigen typedef（`Vec3`,`Mat3`,`TVerticesMat`=3×N 顶点矩阵,`Vec2I`,`VecDynamic`…）；宏 `SQR/CUBE`；`RELEASE_ASSERT`。`GRAVITY_AXIS=1`（y 轴）。
- `Strand.h`：`Mesh` 基类持 `mVertPos/mVertPrevPos/mVelocity/vertexMass`，`vertex(i)` 返回第 i 列 3×1 block。`VBDStrand` 加：`edges`(Vec2I 列表)、`edgesStiffness`、`vertAdjacentEdges`（每顶点邻接边 id 列表）、`orgLengths`(rest 长度)、`inertia`、`mVelocitiesPrev`、`prevprevPos`、`hasVelocitiesPrev/hasApproxAcceleration`。两个 `from(...)`：一个全局统一 stiffness（可选 **skip spring**：连 i 与 i+2，用 `stiffnessSkipSpring`，近似**弯曲**）；一个每边给定 stiffness 数组。
- `main.cpp`：
  - `SimulatorParams`：`numFrames=300, substeps=1, numIterations=100, dt=0.01666666(=1/60), accelerationRho=0.5, useAcceleration=false, gravity=(0,-10,0)`。
  - `initializeTilted()`（默认）：`numVerts=20, dis=0.05, stiffness=1e8, m0=1, m1=1000`(末端重 1000×)，`addSkipSpring=true, skipSpringStrength=100`，30° 倾斜，`useAcceleration=false`。→ **high mass ratio** 实验。
  - `initializeHorizontal()`：3 顶点、stiffness 1e6、m0=1 末端 m1=1000、水平。
  - `initializeStiffRatio()`：5 顶点、**交替刚度 1e4/1e8**（高刚度比），m0=m1=0.1，skip spring。注释里还有 3/10 顶点、20000 迭代「converged」等变体。
  - `forwardStep()`：`mVelocity += dt*gravity`；`mVelocity.col(0).setZero()`（pin 第 0 顶点）；`inertia = mVertPos + mVelocity*dt`；存 `mVertPrevPos`；若有上一帧速度，算 `accelerationApprox=(v-vPrev)/dt`，对每个顶点把它在重力方向(0,-1,0)的分量 clamp 到 [0, gravNorm=10]，用 `x = xPrev + dt*vPrev + dt²*gravDir*accelerationComponent` 作初始猜测（**自适应初始化**）；否则 `mVertPos = inertia`。
  - `solve()`（**一次 Gauss-Seidel sweep**）：`dtSqrReciprocal=1/dt²`；对 `iV=1..numVerts-1`（跳过 pinned 0）：`f = m*(inertia-x)*dtSqrReciprocal`，`h = m*dtSqrReciprocal*I`；遍历邻接边累加弹簧 `h_1_1 = stiffness*(I - (l0/l)*(I - diff·diffᵀ/l²))`，力 `±stiffness*(l0-l)/l*diff`；`dx = h.colPivHouseholderQr().solve(f)`；`vertex(iV) += dx`。
  - `getAcceleratorOmega(order, rho, prevOmega)`：order 1→1，2→`2/(2-rho²)`，否则 `4/(4-rho²*prevOmega)`。`applyAccelerator(omega)`：`omega>1` 时 `mVertPos = omega*(mVertPos - prevprevPos) + prevprevPos`。
  - `updateVelocity()`：存 `mVelocitiesPrev`；`mVelocity=(mVertPos-mVertPrevPos)/dt`；pin col(0)=0。
  - `simulate()`：`dt/=substeps`；每帧每 substep：`forwardStep()` → 迭代 `numIterations` 次 `solve()`（若 `useAcceleration` 则每次后算 omega、applyAccelerator、并把 `prevprevPos=prevIterPos`）→ `updateVelocity()` → `saveOutputs()`（写 JSON）。
- 注意：代码里 `outPath` 是 Windows 风格 `C:\Data\...`，`createFolder` 只在 `_WIN32` 下有效——在别的平台要改路径。这是可以诚实指出的小坑。

# 输出
直接用 Write 写出指派给你的每个 HTML 文件到 content.js 指定的路径。写完回报：写了哪些文件、用了哪个 widget、有无存疑事实。**只用本 BRIEF 的事实 + 你 Read 的真实代码；公式用 KaTeX；别臆造性能数字。**
