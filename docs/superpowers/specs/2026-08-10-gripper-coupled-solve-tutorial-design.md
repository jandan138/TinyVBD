# 设计文档 · TinyVBD 增补「夹爪联合求解」篇（Part 15–16）

**日期**：2026-08-10  
**作者**：与用户协作（brainstorming）  
**状态**：已批准并落地（2026-08-10）  
**风格约束**：与现有教程完全一致——`learn/_AGENT_BRIEF.md` 的语气/HTML/桥/公式密度；黄金参考 `0-1-where-we-go.html`、`1-2-variational-euler.html`、`2-2-xpbd.html`；构建与 widget 约定沿用 Newton/IPC/MPM 增补篇。

---

## 1. 目标与受众

在现有 TinyVBD 交互式教程（Part 0–14 + 附录）末尾，**增补一套新内容**，带读者用已经吃透的 **PBD / XPBD 顺序投影直觉**，读懂一类机器人仿真里的真实失败：

> 动作轨迹对了，夹爪仍然夹不起来——因为 mimic、drive 与接触在**顺序投影**里互相覆盖；需要的是**同一次求解里的冲量平衡**（PADMM / Kamino 路线），而不是再调摩擦系数或换执行顺序。

**读者画像**：
- 已读 TinyVBD 原书 Part 0–6，尤其 **2-1 PBD / 2-2 XPBD**；
- 最好读过 Part 7 的 Newton 数据模型（非必须）；
- 懂一点 Isaac / 机器人夹爪更佳，但本篇用**玩具双指**建立主线；
- **不要求**读过 EmbodiedEval OS、评测门禁或 P7 全套记录。

**明确范围（用户已选 A）**：只讲**物理求解故事**。不写评测 OS、EpisodeTrace、pi0.5、产品页、冷启动哈希取证方法论（最多一句“证据采样也可能骗人”）。

---

## 2. 关键决策（已与用户确认）

| 维度 | 决策 |
|---|---|
| 覆盖范围 | **A**：XPBD 顺序覆盖 → 联合冲量求解 → 有界 drive；不含评测架构篇 |
| 案例形态 | **A3**：玩具双指主线 + 真实 apple-to-bowl / row-166 **callout 插叙** |
| 交互档位 | **W3**：含可调迷你夹爪仿真 `gripper-lab` |
| 篇章结构 | **双 Part**：15 原理与诊断；16 一次求平衡 + Lab |
| 放置位置 | 追加 Part 15–16（`p15`/`p16`），同一 `content.js` / CSS / widget registry |
| 语气 | 通俗易懂、深入浅出、娓娓道来；与原书一致 |

---

## 3. 风格一致性（硬约束）

与既有教程对齐，**不另起文风**：

1. **语气**：中文叙述讲「为什么」；英文保留术语（XPBD, PADMM, mimic, drive, compliance, Gauss-Seidel…）。
2. **章节形态**：完整 HTML；`lede` 开场；小节 `id`；结尾「这一节你要带走的」+ 预告下一节；目标约 900–1500 中文字。
3. **桥**：GAMES103 桥（紫）、PBD 桥（琥珀）；需要时 TinyVBD 桥（teal）；Isaac/真实个案用 `callout note/warn`，不新建第四座桥样式（除非后续确认要「评测个案」专用 tag——本期不用）。
4. **数学**：直觉 → 一个关键式 → 桥回已学内容；不堆 PADMM 收敛证明。
5. **Widget**：`data-widget` + `lab` 外壳；纯前端、离线；压轴 lab 的物理内核单独 `*-core.js` + headless 测试（对标 `cloth-lab` / `strand-lab`）。
6. **事实**：写作期用 `learn/_GRIPPER_BRIEF.md`（待写）作唯一事实源；真实数字必须可追溯到 EEOS record / 证据包，并标注「个案、非通用定理」。
7. **YAGNI**：不引入构建工具；不改写 Part 0–14 正文（仅 `content.js` 追加 + script 清单机械更新）。

---

## 4. 核心教学装置

### 4.1 全篇主线一句话

> **位置约束轮流投影，会互相覆盖；夹爪要的是 mimic、有界 drive 与双侧摩擦接触在同一次求解里谈妥的冲量，再统一写回。**

### 4.2 玩具场景（主线符号）

二维（或简化平面）场景，固定符号贯穿 15–16：

- 左/右 leader 指、follower（mimic）；
- 被夹物（滑块/圆盘）；
- 目标开合、stiffness / damping、力限 \(f_{\max}\)；
- 接触法向冲量与摩擦冲量。

### 4.3 真实插叙（A3）

每节至多 1–2 个 callout，点到：

- Isaac 成功专家轨迹 vs Newton `friction_only` 失败；
- 顺序 XPBD / 调 μ / 换顺序被否决的诊断结论；
- row-166 作为「一帧物理单测」的动机；
- Kamino 已联合 mimic+contact、缺有界 force drive。

禁止把 callout 写成 EEOS 操作手册。

### 4.4 Claim 边界（全书反复）

- 教求解结构病，不是调参手册；
- `gripper-lab` ≠ Isaac/Newton 数值等价；
- 插叙数字是个案证据；候选 vs 已否决必须分开；
- 不授权模型分数或「后端已对齐」结论。

---

## 5. 章节大纲

所有 `file` 相对 `learn/`；新建：

- `chapters/15-gripper-why-fail/`
- `chapters/16-coupled-impulse-lab/`

### Part 15 · 夹爪为什么夹不住 · Why the Grip Fails

| id | 标题 | 要点 | widget |
|---|---|---|---|
| 15-1 | 动作对了，为什么还夹不起来 | 轨迹可执行 ≠ 抓取物理；立 claim | — |
| 15-2 | 玩具场景：双指 + mimic + 有界 drive + 被夹物 | 符号表；Isaac 旁注一句 | — |
| 15-3 | 从 Games103 看「顺序投影」 | 桥回 2-1/2-2 | — |
| 15-4 | 夹爪版 XPBD：mimic → drive → contact | 互相覆盖 | `sequential-overwrite` |
| 15-5 | 合同梯子（物理版） | 几何 → drive/mimic → 接触 | `contract-ladder` |
| 15-6 | 为什么调 μ 和换顺序都不够 | 钉死调参冲动；P7-10/11 插叙 | — |
| 15-7 | row-166 思维：把一帧冻成物理单测 | 单帧动机；预告 Part 16 | — |

### Part 16 · 一次求平衡 · One Coupled Solve

| id | 标题 | 要点 | widget |
|---|---|---|---|
| 16-1 | 我们真正要的平衡是什么 | 四类未知冲量；一次写回 | `impulse-balance-board`（可跨 16-2） |
| 16-2 | PADMM 直觉（不为证明定理） | 对偶/残差/谈妥；对照 XPBD | 同上或续用 |
| 16-3 | Kamino 在地图上的位置 | Newton 求解器谱系；缺有界 drive | — |
| 16-4 | 有界 drive：力限必须进求解器 | PD + \(f_{\max}\)；求解内 vs 外 | `bounded-drive-curve` |
| 16-5 | 迷你夹爪 Lab（压轴） | 模式/μ/力限/mimic 可调 | **`gripper-lab`** |
| 16-6 | 物理门禁，不是终态运气 | q/qd/力包络；零摩擦负对照 | — |
| 16-7 | 收束：换后端要带走的语义 | mimic / bounded drive / bilateral friction | — |

**明确不写**：EOS `core/`、评测 cohort CLI、页面部署、425 全轨迹操作步骤。

---

## 6. Widgets（W3）

| widget | 章节 | 说明 |
|---|---|---|
| `sequential-overwrite` | 15-4 | 慢动作：mimic→drive→contact 轮流改指尖位置 |
| `contract-ladder` | 15-5 | 可点三层梯子；每层「已证 / 未证」 |
| `impulse-balance-board` | 16-1/16-2 | 四类冲量与残差直觉板 |
| `bounded-drive-curve` | 16-4 | 理想 PD 力 vs 力限截断；求解内/外对比 |
| **`gripper-lab`** | 16-5 | 2D 迷你双指；见下 |
| `gripper-core.js` | （内核） | 教学用简化冲量/投影模型；**非**真 Newton |

### `gripper-lab` 最小控件

- 求解模式：`Sequential XPBD` / `Coupled (PADMM-style)`
- `μ` 开/关；力限开/关（或 0→\(f_{\max}\) 滑条）；mimic 开/关
- 只读：间距、相对速度、估计夹紧力、是否抬起
- 预设：`夹不住（顺序）` / `夹住（联合）` / `零摩擦应失败`

验证：headless 不变量（零摩擦不能抬起；联合模式在标称参数下可建立静持；顺序模式在同参下失败或明显更弱——以 brief 锁定的教学模型为准）。

---

## 7. 构建架构（沿用零构建）

1. `content.js`：追加 `p15`、`p16` + keywords；可选附录 `a-10` 术语（本期可不做，优先章内术语）。
2. 章节 HTML：复制 `_template.html` / 黄金参考 head + `_SCRIPT_BLOCK.html`。
3. `book.css`：若无需新桥样式则不动；新 lab 控件样式局部写在 widget 或沿用 `.lab`。
4. `learn/_GRIPPER_BRIEF.md`：FACTS + 章节指派 + 真实数字出处（EEOS records 路径/哈希级引用）。
5. 并行：章节写作 subagent 只准用 brief + 指定黄金参考；widget 由实现者编写并测。

---

## 8. 与现有章节的接口

| 关系 | 做法 |
|---|---|
| 前置 | 文内建议先读 2-1、2-2；7-3 可选链接 |
| 对照 | 12-12「接触三条路」互链：本篇是驱动+mimic+接触的机器人故事 |
| 不改写 | Part 0–14 正文不因本篇改结论 |

---

## 9. 不做（YAGNI）

- 不写成 EmbodiedEval OS 教程或 P7 操作手册；
- 不嵌入真实 Isaac/Newton GPU 运行时；
- 不宣称 lab 与 PhysX 数值等价；
- 不在正文展开 PADMM 定理证明；
- 不把「苹果 / 碗 / 第 166 行」做成通用 API 概念（仅插叙）。

---

## 10. 交付物清单

- `docs/superpowers/specs/2026-08-10-gripper-coupled-solve-tutorial-design.md`（本文）
- `learn/_GRIPPER_BRIEF.md`（后续）
- `learn/content.js`：+Part 15–16
- `learn/chapters/15-gripper-why-fail/`（7 HTML）
- `learn/chapters/16-coupled-impulse-lab/`（7 HTML）
- widgets：`sequential-overwrite.js`、`contract-ladder.js`、`impulse-balance-board.js`、`bounded-drive-curve.js`、`gripper-lab.js`、`gripper-core.js`
- headless tests（对标现有 widget 测试风格）
- 可选：`docs/superpowers/plans/2026-08-10-gripper-coupled-solve-tutorial-plan.md`

---

## 11. 开放问题（已定）

1. 暂不新增附录 `a-10`，术语章内讲清。
2. `gripper-lab` 使用无量纲 \(f_{\max}\)；真实约 400 N 仅 callout。
3. 15-1 已加「建议先读 2-1 / 2-2」导读条。
