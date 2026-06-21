# MPM 篇 章节写作 BRIEF + FACTS（给新 Part 13 章节写作 agent）

你在为 **TinyVBD 交互式教程的「MPM 篇」**（**新 Part 13**，`chapters/13-mpm/`）写章节 HTML。零构建、book-like、通俗易懂的中文物理仿真教程，主线「一切都是 `min G(x)`」。

## ⚠️ 当前编号（链接必须用这个）

- Part 1 数学地基（`1-2` 变分 min G(x)、`1-4` 弹簧）、Part 2 谱系（`2-1` PBD、`2-2` XPBD、`2-3` PD）、Part 3 VBD、Part 7–8 Newton/cloth。
- **Part 9 = FEM 篇**（`chapters/09-fem/9-1..9-6`：`9-2` 形变梯度 $F$、`9-3` 超弹性 $\psi(F)$、`9-4` Piola/装配）——**MPM 的本构与 $F$ 更新直接复用它**。
- Part 10 弹性与碰撞（`10-1` Neo-Hookean、`10-2` SPD）、Part 11 AVBD、Part 12 IPC、**Part 13 = MPM（你正在写）**，附录 `a-x`（MPM 参考文献 → 新建 `a-9`）。

## 先 Read 黄金参考

- `chapters/01-foundations/1-2-variational-euler.html`（min G(x)、数学讲法）
- `chapters/02-family/2-1-pbd.html` + `2-2-xpbd.html`（PBD/XPBD——**PB-MPM 接回这里**）
- `chapters/04-code/4-3-solve.html`（逐行/逐数走读）
- `chapters/12-ipc/12-7-worked-example.html` + `12-8-ipc-iteration.html`（**代数字手算 + 伪代码逐段走读**——13-6 MPM Lite 照这个做）
- `chapters/09-fem/9-2-deformation-gradient.html` + `9-3-strain-energy.html`（**MPM 复用的 $F$ 与本构**——若尚未写好，按 `_FEM_BRIEF.md` 的 FACTS 引用）
- 骨架 `_template.html`；导航源 `content.js`；底部脚本块 `_SCRIPT_BLOCK.html`（整段复制）。

## 受众与语气

- 读者已读完全书（VBD、FEM、IPC）。**MPM 是全书第一个真正跳出「网格/mesh」的范式**——要讲清它为什么不同、又为什么仍是 `min G(x)`。
- 中文叙述、讲「为什么」；英文保留概念名（MPM, material point, background grid, P2G, G2P, transfer, PIC, FLIP, APIC, MLS-MPM, particle-in-cell, quadrature, kernel, B-spline, implicit MPM, MPM Lite, PB-MPM, CK-MPM…）。
- 每节 `<p class="lede">` 开场；`<h2 id="takeaway">这一节你要带走的</h2>` 三句话 + 预告链接；~1000–1600 字 + 公式/桥/callout/（指定）widget。

## 全篇主线两句话（反复用）

> **(1) MPM 是混合 Lagrangian-Eulerian：物质点（粒子）携带物理状态、永久 Lagrangian；背景网格只是每步借来算力、用完即弃的 scratch（Eulerian）。它天生擅长巨形变、断裂、沙/雪/泥/流体这种 mesh 会撕裂或缠死的场景。**
> **(2) 它仍没逃出 `min G(x)`：隐式 MPM 就是在网格 DOF（网格速度/位置增量）上最小化同一个 incremental potential——只是 DOF 从「网格顶点」换成了「背景网格节点」，本构来自粒子上携带的 $F$（复用 FEM 篇）。**

## 桥与对照（务必接回）

- **FEM 桥**：粒子上的形变梯度 $F$ 与应变能 $\psi(F)$、应力 $P$ **完全复用 Part 9 FEM 篇**——MPM 只是不在固定网格单元上算 $F$，而在每个粒子上随它运动更新 $F$。链接 `<a href="../09-fem/9-2-deformation-gradient.html">9.2</a>`、`9.3`、`9.4`。
- **PBD/XPBD 桥（接 Part 2）**：**PB-MPM**（13-7）把 MPM 写成约束求解、PBD 式大步长——明确接回 `2-1`/`2-2`。
- **VBD/Newton 桥**：隐式 MPM 的网格求解是又一个 `min G(x)` 的牛顿/优化问题，和 VBD（Part 3）、IPC 全局 Newton（`12-9`）同源。

## HTML 规则（与全书一致）

`<head>`/topbar/layout/search-overlay 复制黄金参考；底部整段复制 `_SCRIPT_BLOCK.html`；`data-root="../../"`、`data-section="13-Y"`、`.eyebrow`=`Part 13 · 13-Y`；每个 `<h2>/<h3>` 唯一 id；术语 `<span class="term">`；数学 KaTeX；callout/桥同全书；`<code>` 内 `<` 转义 `&lt;`。

## 章节结构（9 章；MPM Lite 主讲，PB-MPM/CK-MPM 各一章）

| id | 文件 | 主题 | widget |
|----|------|------|--------|
| 13-1 | `13-1-why-mpm.html` | 为什么 MPM：Lagrangian（mesh，会撕裂/缠死）vs Eulerian（固定网格，对流耗散、难追物质）vs **hybrid**；网格法（FEM/VBD）在巨形变、断裂、拓扑变化、沙雪流上的边界；MPM 用「粒子载状态 + 网格借力」两全 | 无/复用 `cloth-lab` 对照 |
| 13-2 | `13-2-mpm-cycle.html` | **MPM 一步循环**：① P2G（粒子把质量/动量散布到邻近网格节点）② grid solve（在网格上加力、更新网格速度）③ G2P（粒子从网格收集新速度）④ advect（粒子按新速度移动、更新 $F$）。网格每步清零重建（scratch） | `mpm-cycle`（新）|
| 13-3 | `13-3-transfers-apic.html` | **传输**是 MPM 的灵魂与软肋：**PIC**（只传速度→角动量丢失、极度耗散/糊）、**FLIP**（传速度增量→保能量但噪声/不稳）、**APIC**（Jiang 2015，传一个仿射速度场 $C_p$→既保角动量又不糊，现代默认）；MLS-MPM（Hu 2018，用 MLS 把 APIC 和力计算统一、更快） | `transfer-apic`（新）|
| 13-4 | `13-4-F-update-constitutive.html` | 粒子上的形变梯度更新 $F_p\leftarrow(I+\Delta t\,\nabla v_p)\,F_p$（$\nabla v_p$ 从网格速度梯度插值）；本构 $\psi(F_p)\to P_p$ **复用 FEM 篇**；P2G 散布的力就是 $-V_p^0 P_p D_m^{-\top}$ 类项 | 复用 FEM `element-assembly`/`strain-energy-models` |
| 13-5 | `13-5-implicit-mpm.html` | **显式 vs 隐式 MPM**：显式（小步、易炸，PB-MPM/MPM 经典痛点）vs 隐式（大步、稳，但每步要解方程）；**隐式 MPM = 在网格速度/位置增量上 $\min G(x)$**——和 VBD/Newton 同一个变分骨架，牛顿步、线搜索、SPD 投影都回来了 | 无 |
| 13-6 | `13-6-mpm-lite.html` | **MPM Lite 主讲**：核心是「**粒子主要作运动状态的载体**，求解时**去掉基于粒子的求积（quadrature）**、改用**线性核**」；标准 MPM 的隐式求解开销 ∝ 每格粒子数（PPC）×宽核 stencil，MPM Lite 砍掉这个；保留 MPM 对多材料的通用性，隐式显著加速、显式也改善。**手算 + 伪代码走读**（仿 12-7/12-8） | `mpm-kernel-compare`（新）|
| 13-7 | `13-7-pb-mpm.html` | **PB-MPM**（EA SEED, SIGGRAPH 2024, Chris Lewin）：把 MPM 重写成 **position-based / 约束求解**问题，像 PBD 那样允许更大步长、更稳，面向游戏物理；**明确接回 Part 2 的 PBD/XPBD**——同一个「掰位置满足约束」哲学搬到 material point 上 | 复用 `pbd-stiffness` 做对照 |
| 13-8 | `13-8-ck-mpm.html` | **CK-MPM**（Compact-Kernel MPM, arXiv:2412.10399）：一个 **$C^2$ 连续的紧支撑（compact）核**，在稳定性/精度/效率间取新平衡；和 APIC/MLS-MPM 无缝衔接、每粒子关联的网格节点数约为线性核的 2×（远少于二次 B-spline）；可用 Taichi 或开源 GPU MPM 框架实现 | 复用 `mpm-kernel-compare` |
| 13-9 | `13-9-closing.html` | 收尾：三条现代 MPM 路线（MPM Lite 去粒子求积 / PB-MPM 约束求解 / CK-MPM 紧核）对照表；MPM 与 FEM（同本构、异离散）、VBD（同 min G(x)、异 DOF）、IPC（接触可叠加）的关系；参考文献入口 → `a-9` | 无 |

## Widget 指派

- `mpm-cycle`（13-2）、`transfer-apic`（13-3）、`mpm-kernel-compare`（13-6、13-8）。其余复用或纯 prose/math。

## FACTS

**经典 MPM（成熟，可详讲）：**
- 起源 Sulsky et al. 1994（material point method，从 PIC/FLIP 流体法发展）。
- 一步循环：**P2G**（particle→grid，散布质量+动量，用核权重 $w_{ip}$）→ **grid update**（网格上 $m_i v_i$ 加重力/内力、定边界）→ **G2P**（grid→particle 插回速度）→ **advect**（$x_p\mathrel{+}=\Delta t\,v_p$）+ **更新 $F_p$**。网格每步清零（scratch grid）。
- **核（kernel）**：常用二次/三次 B-spline（宽 stencil，每粒子触及 3×3×3 或更多节点）；线性核窄但精度/稳定性差。
- **传输**：PIC（耗散、丢角动量）；FLIP（传 $\Delta v$，保能量但噪声）；**APIC**（Jiang et al. 2015，传仿射矩阵 $C_p$，保角动量+低耗散，现代标准）；**MLS-MPM**（Hu et al. 2018，moving least squares 统一 APIC 与力、提速、好实现）。
- **$F$ 更新**：$F_p^{n+1}=(I+\Delta t\,\nabla v_p)F_p^n$，$\nabla v_p=\sum_i v_i\,\nabla w_{ip}^\top$。本构 $\psi(F_p)$、$P_p=\partial\psi/\partial F$ 复用 FEM 篇（Neo-Hookean / 弹塑性 / 流体本构皆可——MPM 的通用性卖点）。
- **隐式 MPM**：把网格更新写成优化/牛顿求解（在网格动量/位置增量上最小化 incremental potential），换大稳定步长——就是网格 DOF 上的 `min G(x)`（Stomakhin/Gast 等）。

**前沿三篇 —— DO-NOT-STATE：WebFetch 被拦，只述机制、引来源、不臆造精确公式与性能数字：**
- **MPM Lite**（项目页 `mpmlite.github.io`，*Linear Kernels and Integration without Particles*）：粒子主要作 kinematic state 载体；**求解时不用基于粒子的 quadrature**、用**线性核**；解决「标准做法里隐式解开销 ∝ PPC × 宽核」的瓶颈；保留多材料通用性，隐式大幅加速、显式也改善。**不要写具体加速倍数/网格规模/作者列表除非另行核对**；机制可讲。
- **PB-MPM**（EA SEED，SIGGRAPH 2024，Chris Lewin）：position-based，把 MPM 当约束求解、PBD 式大步长/高稳定，面向游戏。论文 PDF 在 EA SEED 站点。**接回 Part 2**。
- **CK-MPM**（arXiv:2412.10399，*A Compact-Kernel Material Point Method*）：$C^2$ compact kernel；衔接 APIC/MLS；每粒子关联网格节点数约线性核 2×（比二次 B-spline 省）；可用 Taichi/开源 GPU MPM 实现。机制可讲，精确数值以论文为准。

## 纪律 / DO-NOT-STATE

- 前沿三篇：不臆造精确公式、加速比、网格/粒子规模；不确定就只描述机制 + 引项目页/arXiv。
- worked example（13-6）标「自洽示例、非论文复现」。
- 不说 MPM 在 TinyVBD/Newton 代码里（本书代码无 MPM）；本篇是概念/算法篇。
- 经典 MPM（P2G/G2P/APIC/$F$更新/隐式）是成熟内容，可作定论讲。

## 输出

直接 Write 指派的每个 `chapters/13-mpm/13-Y-*.html`。回报：写了哪些文件、用了哪个 widget、有无存疑。**复用 FEM 篇的 $F$/$\psi$；PB-MPM 接回 Part 2；隐式 MPM 接回 min G(x)；前沿守 DO-NOT-STATE；手算/伪代码仿 12-7/12-8。**
