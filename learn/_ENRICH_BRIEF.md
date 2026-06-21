# 加厚 BRIEF（_ENRICH_BRIEF.md）— Part 0–10 按需加厚（worked example + 公式 + widget + 误区）

给加厚 agent。这是对**已存在的成熟章节**做"按需加厚"，不是重写、不是凑字数。基于 4 份逐章审计（`_audit_part012.md` / `_audit_part34.md` / `_audit_part567.md` / `_audit_part8910.md`）汇总出的**精确工作清单**。

## 铁律

- **按需加、绝不凑字数。** 审计标 `[OK]` 的章**一个字都不要动**。绝大多数章已经很好——全书的唯一系统性缺口是「缺手算数字」（gold standard 4-3/11-7 那种"代具体数字算一遍"）。
- **加厚 = 插入，不是重写。** 在现有章里**插**一个 worked-example 小节 / 一个 callout / 一段补全的推导 / 嵌一个已有 widget。保留原有结构、语气、所有已写好的内容。
- **复刻 gold standard 手法**：先 Read `chapters/04-code/4-3-solve.html`（逐行对公式）和 `chapters/11-ipc/11-7-worked-example.html`（代数字手算、每步中间值写出来能复算、callout 标注"示意/趋势才真"）。新加的 worked-example 用这个节奏。
- **HTML 规范**同全书：worked-example 用 `<h2 id="...">` 小节 + `<div class="math-block">$$..$$</div>` 写中间值；误区用 `<div class="callout warn">`/`note`；术语 `<span class="term">`。新加的 `<h2>/<h3>` 必须有唯一 id（右栏 scroll-spy）。嵌 widget 用标准 `<div class="lab">…<div class="lab-body" data-widget="NAME"></div>…</div>`，且确认该 widget 的 `<script>` 已在该章底部脚本块加载（若没有就补一行；所有 widget 脚本清单见 `_SCRIPT_BLOCK.html`）。
- **不臆造**：worked-example 的数都用审计给的、或章里已提到的；标注"为讲解构造的自洽示例"。不写未核对性能数字（沿用各 BRIEF 的 DO-NOT-STATE）。

## 共享参数集（让跨章 worked-example 自洽、可互相引用）

凡用到 strand/弹簧/惯性的手算，**尽量统一**用这组（审计已采纳）：
- 时间步 $h=1/60$ → $1/h^2 = 3600$。
- 轻顶点 $m=1$ → $m/h^2 = 3600$；重端 $m=1000$ → $m/h^2=3.6\times10^6$（高质量比 1:1000，呼应 5-1）。
- 软弹簧 $k=10^3$、硬弹簧 $k=10^8$（呼应 5-2 高刚度比）。
- 教学用小弹簧：$k=100,\ l_0=1$，压缩到 $l=0.5$ → $\lambda_\parallel=100,\ \lambda_\perp=k(1-l_0/l)=100(1-2)=-100$。

---

# 精确工作清单（只做这些；未列出的章 = OK，跳过）

每条给了**确切要插的内容**。"插在哪"用就近的小节描述；agent Read 该章后自行找最合适的插入点（通常在相关公式/结论之后、takeaway 之前）。

## Part 1（数学地基）—— 最高价值，4 处手算
- **1-1 time-integration**：插一个 3 行**放大倍数数值表**。用书自己的 $k=10^8,m=1$ → $\omega=10^4,h=1/60,\xi=h\omega\approx167$，算 $G_\text{fwd}=\sqrt{1+\xi^2}\approx167$（每步 ×167 → 爆）、$G_\text{symp}=1$ 但 $\xi=167\gg2$ → 失稳、$G_\text{back}=1/\sqrt{1+\xi^2}\approx0.006$（每步压到 0.6%）。可选 `note`：symplectic 的 2×2 更新矩阵 + "特征值模为 1 当且仅当 $\xi<2$"。
- **1-3 inertia-elastic**：插 $m/h^2$ vs $k$ **拔河数值**。轻顶点 $3600$、重端 $3.6\times10^6$；软 $k=10^3$ 时惯性碗 $3.6\times10^6$ 碾压 3600:1（漂向 $y$），硬 $k=10^8$ 时压过重端。把"三个数量级"变成算术。**并嵌已有 `mass-ratio` widget**（本章就是讲质量比，却没 widget；脚本需在底部加载）。
- **1-4 spring-energy**：插**特征值手算**（最高价值）。$k=100,l_0=1,l=0.5$ → $\lambda_\parallel=100,\lambda_\perp=-100$；加惯性偏置 $m/h^2=3600$ → 有效 $\perp$ 特征值 $3500>0$ 重新凸；但 $k=10^8$ 时 $\lambda_\perp=-10^8$，偏置 $3600$ 救不回 → 仍不定。一处算清"压缩→不定"+"偏置非万能"，直接喂现有 warn callout。
- **2-1 pbd + 2-2 xpbd（链式）**：
  - 2-1 插**单弹簧一次投影**：$x_a=(0,0),x_b=(1.5,0),l_0=1,w=1$ → $C=0.5,s=C/\sum w\|\nabla C\|^2=0.5/2=0.25$，两端各挪 0.25 → 新长 1.0（一次到位）。
  - 2-2 插**同一根弹簧的 XPBD**：$k=100→\alpha=0.01,\tilde\alpha=\alpha/h^2=0.01\times3600=36$；首迭代 $\lambda=0$ → $\Delta\lambda=(-C-0)/(\sum w\|\nabla C\|^2+\tilde\alpha)=-0.5/(2+36)\approx-0.0132$，比 PBD 的 0.25 小约 19×（软所以推得少）；再取 $k=10^8→\tilde\alpha\to0$ 退回 PBD 的 0.25。说明"$\tilde\alpha$ 是物理刹车、$\alpha\to0$ 退回 PBD"。

## Part 3（VBD 核心）—— 3 处手算 + 1 个 widget 接线
- **3-3 newton-step**（#1，章里自称"小到能手算"却没算）：插**单顶点 3×3 装配全程**。惯性块 + 两条邻接弹簧（$d,l,l_0/l,\mathbf d\mathbf d^\top$ 外积、± 号）→ 拼出 $\mathbf H_i$(3×3) 与 $\mathbf f_i$(3×1) → 解 $\Delta x=\mathbf H_i^{-1}\mathbf f$。用共享参数集。
- **3-2 local-global-descent**（纯抽象，零数字）：插 **3 顶点 strand 例子**，让 $\Delta G$ 与 $\Delta G_i$ 数字对上、且共享弹簧因邻居没动贡献 0。把"trust me"变"verified"。
- **3-4 coloring-parallel**（零视觉，但 widget 已存在却没加载）：**嵌已有 `graph-coloring` + `parallel-sweep`**（底部脚本补两行）。纯接线，高价值。
- **3-5 stability**（可选）：与 3-2/3-3 **共用同一组 strand 参数**，让三章手算互相引用，达到 11-7 的"可复算"质感。

## Part 4（代码走读）—— 1 处手算
- **4-2 forward-step**：插**两顶点对照**——自由下落顶点 $\tilde a\approx10$ 吃满 $h^2 g$；被托住顶点 $\tilde a\approx0$ 原地不动。把自适应初始化的 clamp 说具体。
- 4-1/4-3/4-4/4-5 = OK（4-3 是 gold standard，4-4 已有 worked-example+widget+误区）。

## Part 5（实验）—— 3 处，多为嵌 widget + 小算
- **5-2 stiffness-ratio**（唯一没 widget 的实验章）：插 **2×2 toy-Hessian 特征值比推导**（条件数↔刚度比，章里断言未推）；**嵌已有 `vbd-sweep`/`strand-lab`** 展示 100 vs 20000 迭代的半收敛态。
- **5-3 skip-spring**：插**折叠几何小算**（直 → 力 0；折 90° → 压缩 ≈0.029 × $k=100$ → 回复力）；把外链的 `strand-lab` **内嵌**本章。
- **5-1 mass-ratio**（LIGHT）：小 worked-example——XPBD $\Delta x=w\nabla C\Delta\lambda$ 在 1000× 质量比下给出 1:1000 位移分配，"重端几乎不动"可算。
- 5-4 = OK（capstone strand-lab 位置好）。

## Part 6 = 全 OK（叙事/收尾章，worked-example 不适用）。跳过。

## Part 7（Warp/Newton 基础）—— 1 处手算 + 1 个 widget 接线
- **7-2 warp-model**（最高单点）：插 **`dim=5` 的 `wp.launch` tid→data 映射追踪**（thread 2 的下标全是 2，对上 TinyVBD 的 `for iV` 第 2 次迭代）。章里有 `warp-launch` widget 但正文没追这个映射。
- **7-4 minimal-program**（零成本）：把已加载但没用的 `graph-coloring` widget 丢进 `builder.color()` 小节。
- 7-1/7-3 = OK（叙事/数据模型章）。

## Part 8（strand→cloth）—— 2 处手算
- **8-4 newton-step-warp**（最高价值，对标 4-3 缺"代数字"段）：插**单顶点 3×3 装配手算**：$m=1,dt=1/60$ → 惯性 $f=(0,-72,0)$（重力）、$h=3600\,\mathbf I_3$；加一条具体弹簧；解 $\Delta x=\mathbf H^{-1}\mathbf f$。
- **8-3 initialization**：插"被托住顶点 naive 落 2.7mm vs adaptive 落 0"**数值对照** + 半行 $\tilde a$ clamp 式。
- 8-1/8-2/8-5 = OK（8-5 是 Part 8 最完整的）。

## Part 9（弹性/碰撞）—— 2 处手算 + 1 个 widget 接线
- **9-1 elastic-elements**：插**一次 Neo-Hookean membrane 能量求值**（$F→I_c→J_s=1.21→\alpha→\psi$）；补 **dihedral bending 的 $\cos\theta=\mathbf n_1\cdot\mathbf n_2/(|\mathbf n_1||\mathbf n_2|)$** 几何（章里唯一真正略过的）；加 **"membrane ≠ 三根边弹簧"误区** callout。
- **9-2 spd-damping**（唯一特征值章却没 widget）：插**压缩元件特征值钳取手算**（沿 $d$:+1、垂直:−0.25 → 钳到 0 → 惯性抬正，复用 1.4 弹簧 Hessian）；**嵌已有 `spring-hessian`**（脚本已在其底部块）。
- 9-3 = OK（BRIEF 故意让它当 IPC 概念锚，11-7 已为 log-barrier 做了数值例）。

## Part 10 = 全 OK。10-1 受 DO-NOT-STATE 限制不能补 AVBD 精确式；10-2 是收尾章。跳过。

---

# 执行与输出

- 分波执行（建议：Part 1+2 一波、Part 3+4 一波、Part 5+7 一波、Part 8+9 一波）。每波 agent **只 Read+Edit 指派的章**，按上面清单逐条插入。
- 每章改完自检：新 `<h2>/<h3>` 有唯一 id；嵌的 widget 的 `<script>` 已在该章底部加载；math-block 的 `$$` 配对；`<` 在 code/math 内转义为 `&lt;`。
- **不碰** content.js（没有新增章、没改文件名）、不碰 `[OK]` 章。
- 回报：每章插了什么（worked-example/widget/推导/误区）、有无存疑。
