# Newton 篇 章节写作 BRIEF + FACTS（给 Part 7–10 章节写作 agent）

你在为 **TinyVBD 交互式教程的「Newton 篇」**（Part 7–10 + 附录 a-4/a-5/a-6）写章节 HTML。
**先 Read 三个黄金参考**（语气 / HTML 用法 / widget 嵌入 / 数学讲法）：
- `chapters/00-orientation/0-1-where-we-go.html`（语气、HTML、widget 嵌入）
- `chapters/01-foundations/1-2-variational-euler.html`（数学讲法、桥、公式密度）
- `chapters/04-code/4-3-solve.html`（逐行代码走读的讲法）
- 骨架：`_template.html`；导航源：`content.js`；底部脚本块：`_SCRIPT_BLOCK.html`（**新章节直接整段复制它**）。
- 原 BRIEF：`_AGENT_BRIEF.md`（HTML 规则与本篇一致，下面只列差异/新增）。

---

## 受众与语气（在原书受众之上）

- 读者**已读完 TinyVBD 原书**：吃透了 `min G(x)`、per-vertex `Δx = H⁻¹f`、Gauss-Seidel sweep、Chebyshev、高质量比稳定性、弹簧 Hessian。
- 读者**懂 Isaac / OpenUSD**（来自 EBench 背景）。
- 读者**完全不懂 Newton，也不懂 Warp**（Newton 的 GPU kernel 语言 / Python 框架）。
- 中文叙述、娓娓道来、讲「为什么」；**英文保留所有架构术语、命令名、性能指标、概念名**（Newton, Warp, kernel, `wp.launch`, graph coloring, Neo-Hookean, augmented Lagrangian, primal/dual…）。
- 每节 `<p class="lede">` 导言开场；结尾小标题收束并预告下一节；目标 ~900–1500 中文字正文 + 公式/代码/callout/桥/（指定的）widget。

## 三座桥 + Isaac/USD 旁注

- GAMES103 桥（紫）：`<div class="bridge g103">`、PBD 桥（琥珀）：`<div class="bridge pbd">`（原书已有，按需少量用）。
- **TinyVBD 桥（teal，本篇主力）**：每引入一个 Newton 概念，就把它接回读者已吃透的那根 strand：
  ```html
  <div class="bridge tinyvbd"><div class="c-h"><span class="tag">从 TinyVBD 看</span> 标题</div><p>…</p></div>
  ```
- **Isaac/USD 旁注**：用普通 `<div class="callout note">`（不新建桥），把 Newton 概念类比到读者熟的 Isaac/USD。

## 全篇主线一句话（反复用）

> **`min G(x)` 没变；变的是「一根 strand 串行 → 一块 cloth 在 GPU 上按颜色并行」。**

并**诚实点名两处 Newton particle 路径与 TinyVBD 的差异**（已用真实代码核对）：
1. Newton 的 particle solve **没有 Chebyshev 加速**（只有按颜色的 Gauss-Seidel）。
2. Newton 用**朴素惯性初始化** `y = x + (v + g·dt)·dt`，**不是** TinyVBD 的自适应初始化（`accelerationComponent` 那套）。

## HTML 规则（与原书一致，差异点）

- 复制黄金参考的 `<head>`/topbar/layout/search-overlay；**底部脚本块整段复制 `_SCRIPT_BLOCK.html`**（已含全部新旧 widget）。`data-root="../../"`，`data-section="X-Y"` 必须等于章节 id。
- 每个 `<h2>/<h3>` 带唯一 `id`。术语 `<span class="term">English</span>`。
- 代码块：Newton/Warp 代码用 `data-lang="python"`，TinyVBD 代码用 `data-lang="cpp"`：
  ```html
  <div class="code" data-lang="python"><div class="code-h"><span class="fn">particle_vbd_kernels.py</span><button class="cp">复制</button></div><pre><code>...</code></pre></div>
  ```
  `<code>` 内 `&lt; &gt; &amp;` 必须转义。
- 数学：行内 `$...$`，行间 `<div class="math-block">$$...$$</div>`（KaTeX）。直觉 + 关键公式，别堆代数。
- 章节交叉引用用相对链接（按 content.js 的 file 路径），如 `<a href="../01-foundations/1-2-variational-euler.html">1.2</a>`。

## Widget→章节 指派（每个只在指定章节用）

- `warp-launch` —— SPMD `wp.launch(dim=N)` 小可视化。用于 **7-2**。
- `strand-lab`（复用）—— 回顾你已懂的 strand。用于 **8-1**（开篇钩子）。
- `vbd-sweep`（复用）—— 慢动作逐顶点 Gauss-Seidel。用于 **8-4**。
- `graph-coloring` —— 顶点图(primal) vs 约束图(dual) 着色、数颜色。用于 **8-5**。
- `parallel-sweep` —— 按 color 并行 vs TinyVBD 串行 sweep。用于 **8-5**。
- `cloth-lab`（压轴）—— 真跑 2D 三角网格 cloth VBD，可拖、可切 color。用于 **9-1**。
- `avbd-penalty-ramp` —— 调 k_start/β/γ 看 penalty 演化。用于 **10-1**。
- `mass-ratio`（复用）—— 高质量比 VBD vs PBD-style。用于 **10-1**（软肋回顾）。
- 其它章节不放 widget（用 prose/code/math/桥）。

---

# 事实库（FACTS）—— 只用这里 + 你 Read 到的真实代码，别臆造数字

来源仓库：Newton = `/cpfs/shared/simulation/zhuzihou/dev/newton`（只读，用于核对）。引用尽量带 `file:line`。

## A. Newton / Warp 架构

- **Newton 是什么**：GPU 加速物理引擎，建立在 **NVIDIA Warp** 之上，面向 robotics / 仿真研究（`README.md:8`）。扩展并泛化了 Warp 的（已 deprecated 的）`warp.sim`，集成 **MuJoCo Warp** 作主要后端；强调 GPU 计算、**OpenUSD** 支持、可微、可扩展（`README.md:10-11`）。由 Disney Research / Google DeepMind / NVIDIA 发起，现为 **Linux Foundation** 项目，Apache-2.0。
- **求解器**：Newton 提供 XPBD、**VBD**、MuJoCo、Featherstone、SemiImplicit 等（`docs/index.rst`）。`SolverVBD` 对 **particle 用 VBD，对 rigid 用 AVBD**（`newton/_src/solvers/vbd/solver_vbd.py:88` 类 docstring）。
- **Warp 编程模型**（SPMD）：
  - `@wp.kernel`：并行入口，`wp.launch(kernel, dim=N, inputs=[...])` 启动 N 个 thread，每个 thread 内 `tid = wp.tid()` 取自己的索引。见 `forward_step`（`particle_vbd_kernels.py:1783`，第一行就是 `particle = wp.tid()`）。
  - `@wp.func`：device 函数（类似 CUDA `__device__`），可被 kernel 调用，如各 `evaluate_*_force_hessian`。
  - `wp.array[dtype]`：GPU 数组，dtype 如 `wp.vec3`/`wp.mat33`/`wp.float32`/`wp.int32`。
  - `wp.struct`：打包数据，如 `ParticleForceElementAdjacencyInfo`（`particle_vbd_kernels.py:66`）。
  - **CUDA graph capture**：`with wp.ScopedCapture() as capture: ...; wp.capture_launch(capture.graph)` 把整段仿真循环录成 CUDA graph 零开销重放（见 examples）。
- **核心数据模型**（`newton/_src/sim/` 下）：
  - **Model**（静态）：粒子/刚体/关节/形状/物理属性，数组按 id 索引；`particle_q`、`particle_mass`、`gravity`、`particle_color_groups`、`body_color_groups` 等。
  - **State**（动态，一个时刻的快照）：`particle_q: wp.array[wp.vec3]`（位置）、`particle_qd`（速度）、`particle_f`（力）；刚体 `body_q: wp.array[wp.transform]`、`body_qd: wp.array[wp.spatial_vector]`。
  - **Control**：控制输入（`joint_f`、`joint_target_q` 等）。
  - **Contacts**：碰撞检测输出（`model.collide(state, contacts)` 填充）。
  - **ModelBuilder**：搭场景 → `builder.finalize()` 冻结成 Model。
- **求解器契约**：`solver.step(state_in, state_out, control, contacts, dt)`（`solver_vbd.py:1578`）。典型主循环：
  ```python
  model.collide(state_in, contacts)
  solver.step(state_in, state_out, control, contacts, dt)
  state_in, state_out = state_out, state_in
  ```
- **Coloring**：`builder.color()` 给 particles + rigid bodies 着色，结果存 `model.particle_color_groups`（particle 必需）/ `model.body_color_groups`（rigid 由 VBD 积分时必需）。`SolverVBD` 构造时检查 `particle_color_groups` 存在（`solver_vbd.py:536-540`）。为什么需要：同色顶点之间不共享 force element，可并行更新，得到 Gauss-Seidel 收敛 + 近 Jacobi 并行。
- **最小程序**（faithful 重构自 `newton/examples/basic/example_basic_pendulum.py`）：
  ```python
  import newton
  builder = newton.ModelBuilder()
  # ... add particles / cloth / shapes ...
  builder.color()                      # 必需：给 VBD 着色
  model = builder.finalize()
  solver = newton.solvers.SolverVBD(model)
  state_0, state_1 = model.state(), model.state()
  control, contacts = model.control(), model.contacts()
  for frame in range(N):
      for _ in range(substeps):
          state_0.clear_forces()
          model.collide(state_0, contacts)
          solver.step(state_0, state_1, control, contacts, dt)
          state_0, state_1 = state_1, state_0
  ```
- **Isaac/USD ↔ Newton 映射**（用于 callout note / 附录 a-5）：
  - Model/State 分离 ↔ Isaac 的 root-state tensor / USD stage 的静态资产 vs 动态属性。
  - `builder.color()` ↔ Isaac 无直接对应（VBD/约束求解特有）。
  - **四元数顺序**：Newton/Warp 用 `(x, y, z, w)`；Isaac 用 `(w, x, y, z)` —— 互转要换序（`docs/concepts/conventions.rst`）。
  - 碰撞：Newton 自己的 collision pipeline（broad→narrow，BVH/SDF）↔ Isaac 的 PhysX broadphase/narrowphase。

## B. particle VBD 代码（`newton/_src/solvers/vbd/`，务必 Read 核对）

- **`step()` 三段式**（`solver_vbd.py:1578` 起）：
  1. **Initialize**：`_initialize_particles`（前向积分 + penetration-free 截断，`solver_vbd.py:1734`）、`_initialize_rigid_bodies`（AVBD warm-start，`:1771`）。
  2. **Iterate**：`for iter_num in range(self.iterations)`：交替 `_solve_rigid_body_iteration`（AVBD）与 `_solve_particle_iteration`（VBD，`:2154`）。
  3. **Finalize**：`_finalize_particles`（由位移算速度，`:2766`）、`_finalize_rigid_bodies`（`:2779`）。
- **惯性初始化**（`forward_step` kernel，`particle_vbd_kernels.py:1783-1808`）：
  - `pos_prev = pos`；`vel_new = vel + (gravity + external_force * inv_mass) * dt`；`inertia = pos + vel_new * dt`。
  - **就是朴素惯性位置**，没有 TinyVBD 那套 `accelerationComponent` 自适应初始化。**这是要对照点名的差异。**
- **per-vertex 装配 + 牛顿步**（`solve_elasticity` kernel，`particle_vbd_kernels.py:3136-3274`）：
  - 惯性项：`f += mass * (inertia - x) / dt²`，`h += (mass / dt²) * I`（`:3172-3173`）。形式与 TinyVBD `solve()` 完全一致，只是 3D（3×3）。
  - 弹性项：对邻接元件累加力/Hessian（membrane / volumetric / bending / spring，见下）。
  - 接触项：self-contact、body-particle contact 的力/Hessian。
  - **牛顿步**：`Δx = H⁻¹ f`，带 `|det(H)|` 阈值检查（`:3271`）；位移累加 `particle_displacements[i] += H_inv * f`。
  - **没有 Chebyshev**。整套就是按 color 的 Gauss-Seidel。
- **按 color 的并行 sweep**（`_solve_particle_iteration`，`solver_vbd.py:2154-2340`）：
  - `for color in range(len(model.particle_color_groups))`：先清零力/Hessian → 累加 body-particle contact / spring / self-contact → 对该 color 的顶点解 elasticity（`solve_elasticity` 或 tile 版 `solve_elasticity_tile`，block_dim=16）→ penetration-free 截断。
- **弹性元件类型**（`@wp.func`，`particle_vbd_kernels.py`）：
  - **Neo-Hookean membrane**（cloth 三角，`:864-1024`）：deformation gradient F 是 3×2；能量 `ψ = (μ/2)(I_c-2) + (λ/2)(J_s-α)²`，`α=1+μ/λ`；stable NH 约定 `λ_NH = λ_Lamé + μ_Lamé`（Smith 2018 §3.4）；Hessian 做 **SPD 投影**（`s_clamp = max(0, λ_NH(J_s-α))`）。
  - **Volumetric Neo-Hookean**（tet soft body，`:334-467`）：F 是 3×3；`ψ = (μ/2)(I_1-3-2ln J) + (λ/2)(J-1)²`。
  - **Dihedral bending**（`:1057-1189`）：二面角能量 `E = (k·L_rest)(θ-θ_rest)²/2`；边界边跳过。
  - **Spring**（`accumulate_spring_force_and_hessian`，`solver_vbd.py:2228`）：用 `spring_rest_length/stiffness/damping`，**力/Hessian 形式同 TinyVBD 弹簧**（这是 TinyVBD 桥的天然接口）。
  - 材料参数 `tri_materials`/`tet_materials` 格式 `[mu, lmbd, damping]`。
- **Rayleigh damping**：`D = kd · ke`（kd 是无量纲 Rayleigh 系数，`solver_vbd.py:117`）；membrane/volumetric 各有 Frobenius/trace 形式的耗散项。
- **velocity 更新**（`update_velocity`，`particle_vbd_kernels.py:1901-1903`）：`vel = (pos - pos_prev) / dt`（后向差分），与 TinyVBD `updateVelocity()` 一致。
- **self-collision / penetration-free**：
  - `TriMeshCollisionDetector`（`tri_mesh_collision.py`）：BVH，vertex-triangle（`:332`）+ edge-edge 检测。
  - 力/Hessian：`accumulate_self_contact_force_and_hessian`（log-barrier 接触 + Coulomb 摩擦）。
  - **penetration-free 截断**（DAT，`solver_vbd.py:1672-1732`）：每色 sweep 后按保守界把位移截断，保证不穿透。
  - 对照：**TinyVBD 完全没有碰撞**。
- **与 400 行 strand 的差异小结**：GPU(Warp) vs CPU 2D；多元件(三角/tet/bending/spring) vs 仅线段；BVH 自碰 + penetration-free vs 无碰撞；按 color 多色 sweep vs 单 Gauss-Seidel pass；3×3 H 求逆(det 检查) vs colPivHouseholderQr；**无 Chebyshev** vs TinyVBD 有；朴素惯性初始化 vs 自适应初始化。

## C. VBD / AVBD 论文（外部，仅写已验证项）

- **VBD 2024**：Anka He Chen, Ziheng Liu, Yin Yang, Cem Yuksel；ACM TOG 43(4) Art.116（July 2024）；arXiv:2403.06321；DOI 10.1145/3658179。核心：隐式欧拉变分形式的 **block coordinate descent**，顶点级 Gauss-Seidel，每顶点 3×3 牛顿步，顶点图着色（颜色远少于约束图）；**unconditionally stable**；加速用 **Chebyshev**（Wang 2015）——但 **Newton 的 particle 路径没用它**。高刚度比是其 **局限**，由 AVBD 补。
- **AVBD 2025**：Chris Giles, Elie Diaz, Cem Yuksel；ACM TOG 44(4) Art.90（Aug 2025）；DOI 10.1145/3731195。在 VBD 上加 **augmented Lagrangian + 自适应 primal-dual**：能强制**硬约束（近无穷刚度）**且**高刚度比收敛更好**；支持 rigid 接触/堆叠/摩擦/关节。**penalty ramping**（warm-start，论文 Eq.17，量级核对以论文为准）：每帧 `k ← max(γ·k, k_start)`、`λ ← α·γ·λ`；迭代内对仍违反的约束以 **β 增长**；**soft 约束封顶在材料刚度，hard 约束可冲向无穷**。论文给的默认参数（无需调参）：**α=0.95, β=10, γ=0.99** + per-constraint `k_start`。
- **Newton 里的 AVBD**：rigid 用 AVBD；当前 Newton 文档注明 rigid **用软约束 + 自适应惩罚**（hard 约束在 Newton 里当前不强制）。相关 solver 参数：`rigid_avbd_gamma`、`rigid_contact_k_start`、`rigid_joint_linear_k_start`、`rigid_joint_angular_k_start`、`rigid_avbd_beta`（`solver_vbd.py:223` 一带）。
- **可视化参考**：AVBD 官方视频 `youtube.com/watch?v=bwJgifqvd5M`；Chris Giles 2D 参考实现 `github.com/savant117/avbd-demo2d`；Utah 项目页 `graphics.cs.utah.edu/research/projects/avbd/`。

## D. DO-NOT-STATE（未验证，WebFetch 被拦，**不要当事实写进正文**）

- 具体 VBD 性能数字（如 3.6/3.9 s、4.2/4.7 s/timestep、48M 顶点等）——未经 PDF 核对，**别写死**。
- graph-coloring 颜色缩减倍数（4×/48× 之类）——来自一般文献，非 VBD 论文，**别归给 VBD**。
- MuJoCo Warp 252×/475× 等营销数字；AVBD arXiv id（疑无）；"Newton 1.0" 里程碑——**别写**。
- AVBD Eq.17 的精确公式记号——**核对论文后**再写，不确定就只描述机制（衰减/封顶/增长），别贴精确等式当权威。

# 输出

直接 Write 指派给你的每个 HTML 文件到 content.js 指定路径。写完回报：写了哪些文件、用了哪个 widget、有无存疑事实。**只用本 BRIEF 的事实 + 你 Read 的真实代码；公式用 KaTeX；别臆造性能数字；遵守 DO-NOT-STATE。**
