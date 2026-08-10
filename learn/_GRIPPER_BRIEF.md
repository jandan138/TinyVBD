# 夹爪联合求解篇 BRIEF + FACTS（Part 15–16 写作 agent）

你在为 **TinyVBD 交互式教程的「夹爪联合求解」篇**（Part 15–16）写章节 HTML。

**先 Read 黄金参考**（语气 / HTML / widget / 数学密度必须一致）：
- `chapters/00-orientation/0-1-where-we-go.html`
- `chapters/01-foundations/1-2-variational-euler.html`
- `chapters/02-family/2-2-xpbd.html`
- 骨架：`_template.html`；导航：`content.js`；底部脚本：`_SCRIPT_BLOCK.html`（**整段复制**，已含本篇 widget）
- 设计：`docs/superpowers/specs/2026-08-10-gripper-coupled-solve-tutorial-design.md`
- 原 BRIEF：`_AGENT_BRIEF.md`（HTML 规则一致）

---

## 已定决策（勿改）

- **范围 A**：只讲物理求解故事，不写评测 OS / EpisodeTrace / pi0.5 / cohort CLI。
- **案例 A3**：玩具双指主线；真实 apple-to-bowl / row-166 只用 `callout` 插叙。
- **交互 W3**：压轴 `gripper-lab`（教学 2D 模型，**非**真 Newton/Isaac）。
- **开放问题定稿**：
  1. 暂不新增附录 a-10（术语章内讲清即可）。
  2. Lab 力限用**无量纲** \(f_{\max}\)；真实个案 400 N 只在 callout 出现，并写明「个案、非数值等价」。
  3. 15-1 开篇加「建议先读 2-1 / 2-2」导读条。

## 受众与语气

- 读者已吃透 TinyVBD Part 0–6，尤其 PBD/XPBD；可能懂一点 Isaac。
- **通俗易懂、深入浅出、娓娓道来**——先画面，再一个关键式，再一句真实插叙。
- 中文叙述；英文保留术语：XPBD, PADMM, mimic, drive, compliance, impulse, Kamino。
- 每节 `lede`；结尾「这一节你要带走的」+ 预告；~900–1500 中文字。

## 全篇主线一句话（反复用）

> **位置约束轮流投影，会互相覆盖；夹爪要的是 mimic、有界 drive 与双侧摩擦接触在同一次求解里谈妥的冲量，再统一写回。**

## Widget 指派（只在指定章用）

| widget | 章 |
|---|---|
| `sequential-overwrite` | 15-4 |
| `contract-ladder` | 15-5 |
| `impulse-balance-board` | 16-1（可在 16-2 再引用同一交互说明，但 data-widget 主要挂 16-1） |
| `bounded-drive-curve` | 16-4 |
| `gripper-lab` | 16-5 |

## 玩具符号（全书统一）

- Leader 指位置 \(q_L\)，follower \(q_F\)；理想 mimic \(q_F = -q_L\)（或 gap 对称）。
- 被夹物半宽 \(r\)，中心 \(x_o\)。
- Drive：目标 \(q^\star\)，刚度 \(k\)，阻尼 \(d\)；力限 \(f_{\max}\)（无量纲教学值，默认 1）。
- 接触：法向冲量 \(\lambda_n\)，摩擦冲量 \(\lambda_t\)（教学用库仑近似 \(\lvert\lambda_t\rvert \le \mu\lambda_n\)）。
- 模式：`Sequential XPBD` = mimic → drive → contact 轮流写；`Coupled` = 一次求冲量再写回。

## 真实插叙允许写的事实（FACTS）

来源：EmbodiedEval OS TaskBook-03B P7 系列 records（个案）。写 callout 时必须带「个案证据，不是通用定理 / 不是 lab 数值等价」。

1. **现象**：同一条 Isaac 成功专家轨迹，Newton `friction_only`（无 robot–apple 约束、无对象传送）可跑完动作，但抬不起苹果入碗。见 `embodied-eval-os` record `2026-07-28-taskbook03b-p7-4f-frictional-grasp-fidelity.md` / `…-p7-4g-contact-to-hold-divergence.md`。
2. **P7-4G**：接触持握分歧窗口曾定位到专家行附近（记录中的 row 166）；碰撞表示（convex vs raw MESH）与 drive/mimic 拓扑列为优先合同差异——**优先候选 ≠ 已证唯一根因**。
3. **P7-10 / P7-11**：调摩擦、换 XPBD 内 mimic/drive/contact **顺序**不足以作为修复方向；问题被表述为顺序投影互相覆盖 / 需联合耦合。见 `2026-08-06-…-p7-10-…` 与 `2026-08-08-…-p7-11-…`。
4. **Kamino**：仓库有 provider-local Kamino 兼容层，mimic 与 contact 可进同一 dense PADMM；**仍缺**完整 PhysX 风格有界 force drive 作为同一次求解未知量。见 `newton_kamino_mimic_solver.py` 模块头注释。
5. **Isaac 个案量级**（仅 callout）：drive stiffness/damping 量级与力限 ~400 N、夹紧力包络约十余牛——**只作数量级直觉，禁止写成 lab 默认参数或等价证明**。

禁止臆造未在 FACTS / 你 Read 到的 record 中出现的精确分数、哈希、通过率。

## Claim 边界（每章可点一次）

- 教求解结构，不是调参手册。
- `gripper-lab` 是教学模型。
- 插叙 ≠ 根因闭合；不授权模型分或后端对齐。

## HTML 规则

与 `_AGENT_BRIEF.md` 完全一致。`data-section` 必须等于章节 id（如 `15-4`）。交叉引用用相对路径。

底部脚本：**整段复制 `_SCRIPT_BLOCK.html`**（含本篇 6 个新脚本）。
