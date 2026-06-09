# Newton VBD Tutorial Supplement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing TinyVBD interactive HTML book (`learn/`) with a "Newton 篇" — Parts 7–10 (14 chapters) + 3 appendix pages + 5 new interactive widgets — teaching Newton's particle VBD (and an AVBD overview) to a reader who knows TinyVBD, Isaac, and USD but not Newton or Warp.

**Architecture:** Zero-build static site. `content.js` is the nav single-source-of-truth (drives sidebar/prevnext/cover/search). Each chapter is a self-contained HTML file copying the shared `<head>`/topbar/layout/script block. Widgets register into `window.VBWidgets[name]` and auto-mount via `data-widget`. Physics widgets keep their solver in a separate `*-core.js` so it can be headless-tested with a node DOM stub. A new teal "TinyVBD bridge" callout connects every Newton concept back to the strand the reader already understands. All facts come from `learn/_NEWTON_BRIEF.md` (a FACTS doc we write first, grounded in real Newton source `file:line` + verified URLs).

**Tech Stack:** Plain HTML/CSS/JS (ES5-style IIFE widgets, matching existing code), KaTeX (CDN) for math, Canvas 2D for widgets, Node.js for headless widget physics tests.

**Repo paths:**
- Book root: `/cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn/`
- Newton source (read-only, for facts): `/cpfs/shared/simulation/zhuzihou/dev/newton/`
- Spec: `docs/superpowers/specs/2026-06-08-newton-vbd-tutorial-design.md`

**Golden reference files (READ before writing content/widgets):**
- Chapter tone/HTML/widget embed: `learn/chapters/00-orientation/0-1-where-we-go.html`
- Math chapter style: `learn/chapters/01-foundations/1-2-variational-euler.html`
- Code-walkthrough style: `learn/chapters/04-code/4-3-solve.html`
- Skeleton: `learn/_template.html`; Writing rules: `learn/_AGENT_BRIEF.md`
- Widget registry + `VBW` helpers: `learn/assets/js/widgets/registry.js`
- Physics-core pattern: `learn/assets/js/widgets/vbd-core.js`
- Widget UI pattern: `learn/assets/js/widgets/strand-lab.js`
- CSS tokens + bridges: `learn/assets/css/book.css` (`:root` ~line 12, dark ~line 44, `.bridge` ~line 173)

---

## Conventions every task follows

- **Commit after each task** with a clear message. Branch is `main`; commit directly (this is a docs/learn subtree, not production code). If git identity is unset run once: `git config user.email "claude@anthropic.com" && git config user.name "Claude"`.
- **Chapter HTML rule:** copy a golden reference file verbatim, then change ONLY: `<title>`, `data-section="X-Y"`, `.eyebrow`, `<h1>`, `<p class="lede">`, the article body, AND the bottom `<script>` block (must include the new widget scripts — see Task 2 for the canonical block). `data-root="../../"` for all `chapters/<dir>/*.html`.
- **Every `<h2>`/`<h3>` gets a unique `id`** (right-rail scroll-spy depends on it).
- **Terms:** `<span class="term">English</span>` for English terms/commands/class names; math inline `$...$`, block `<div class="math-block">$$...$$</div>`; escape `&lt;&gt;&amp;` inside `<code>`.
- **Bridges:** GAMES103 `<div class="bridge g103">`, PBD `<div class="bridge pbd">`, and the NEW `<div class="bridge tinyvbd">` (Task 1). Callouts: `callout note` / `callout warn` / `callout`.
- **No invented numbers.** Use only facts in `_NEWTON_BRIEF.md` or code you Read. Numbers flagged "unverified" in the research must NOT appear in prose unless corroborated by local Newton code.

---

## File structure (what gets created/modified)

**Created — FACTS doc:**
- `learn/_NEWTON_BRIEF.md` — writing-time fact boundary for all Part 7–10 chapters.

**Modified — shared infra:**
- `learn/content.js` — append Parts p7–p10 + appendix sections a-4/a-5/a-6.
- `learn/assets/css/book.css` — add `--tv`/`--tv-soft` tokens (light+dark) + `.bridge.tinyvbd` rules.

**Created — widgets (in `learn/assets/js/widgets/`):**
- `warp-launch.js`, `graph-coloring.js`, `parallel-sweep.js`, `avbd-penalty-ramp.js` — 4 new widgets.
- `cloth-core.js` (physics) + `cloth-lab.js` (render/interaction) — the centerpiece.

**Created — chapters:**
- `learn/chapters/07-newton-foundations/7-1…7-4.html` (4)
- `learn/chapters/08-strand-to-cloth/8-1…8-5.html` (5)
- `learn/chapters/09-elasticity-collision/9-1…9-3.html` (3)
- `learn/chapters/10-avbd/10-1,10-2.html` (2)
- `learn/chapters/appendix/a-4-newton-glossary.html`, `a-5-mapping-cheatsheet.html`, `a-6-newton-references.html` (3)

**Created — tests (ephemeral, in `learn/_tests/`):**
- `learn/_tests/dom-stub.js`, `learn/_tests/cloth-core.test.js`, `learn/_tests/graph-coloring.test.js`.

---

## Task ordering & dependencies

1. **Task 1** CSS bridge token → 2. **Task 2** content.js nav + canonical script block → 3–7. **Widgets** (each: core/test then UI) → 8. **FACTS doc** → 9–12. **Chapters** (one task per Part, written by subagents from the FACTS doc) → 13. **Appendix** → 14. **Integration verification** → 15. **Memory update**.

Widgets come before chapters so chapter authors can embed verified, working widgets. The FACTS doc (Task 8) can be written in parallel with widgets but is listed before chapters because chapters depend on it.

---

### Task 1: Add the TinyVBD bridge (teal) to the design system

**Files:**
- Modify: `learn/assets/css/book.css` (`:root` block ~line 12–38; `html[data-theme="dark"]` block ~line 44–66; `.bridge` rules ~line 173–182)

- [ ] **Step 1: Add light-theme tokens.** In `:root`, right after the `--pbd-soft: #fcefdd;` line, add:

```css
  --tv: #0e7490;            /* tinyvbd 桥 = teal/青 */
  --tv-soft: #e0f2f6;
```

- [ ] **Step 2: Add dark-theme tokens.** In `html[data-theme="dark"]`, right after the `--pbd-soft: #2c1d10;` line, add:

```css
  --tv: #22d3ee;
  --tv-soft: #0a2a30;
```

- [ ] **Step 3: Add the bridge rules.** Right after the existing `.bridge.pbd .tag { background: var(--pbd); color: #fff; }` line, add:

```css
.bridge.tinyvbd { border-color: var(--tv); background: var(--tv-soft); }
.bridge.tinyvbd .c-h { color: var(--tv); }
.bridge.tinyvbd .tag { background: var(--tv); color: #fff; }
```

- [ ] **Step 4: Verify visually in isolation.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && grep -n 'bridge.tinyvbd\|--tv' assets/css/book.css
```

Expected: 5 matching lines (2 token defs in light, 2 in dark would be 4 `--tv` + 3 `.bridge.tinyvbd`). Confirms all rules present.

- [ ] **Step 5: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/assets/css/book.css && git commit -m "Add teal TinyVBD bridge to book design system"
```

---

### Task 2: Append Newton Parts to content.js + define canonical script block

**Files:**
- Modify: `learn/content.js` (the `parts: [...]` array — append after the `pa` appendix part object's sections, BUT new content parts p7–p10 go BEFORE `pa`; appendix sections a-4/a-5/a-6 are added INTO the existing `pa` part)

**Important:** In `content.js`, `pa` (Appendix) is currently the last part. Insert p7–p10 *between* `p6` and `pa`, and add a-4/a-5/a-6 *inside* `pa.sections`.

- [ ] **Step 1: Insert Parts p7–p10.** Find the `pa` appendix part object (`{ id: "pa", label: "Appendix", …`) and insert these four part objects immediately BEFORE it:

```js
    {
      id: "p7",
      label: "Part 7",
      title: "Newton 的世界 · Foundations (Warp + Newton)",
      sections: [
        { id: "7-1", title: "Newton 是什么：从 Isaac/USD 到 Warp-native 引擎", file: "chapters/07-newton-foundations/7-1-what-is-newton.html",
          keywords: "newton warp isaac usd physx mujoco warp.sim deprecated linux foundation gpu 引擎 robotics 定位 关系 disney deepmind nvidia" },
        { id: "7-2", title: "Warp 编程模型：kernel / array / launch / tid", file: "chapters/07-newton-foundations/7-2-warp-model.html",
          keywords: "warp wp.kernel wp.func wp.array wp.launch wp.tid spmd 线程 gpu vec3 mat33 cuda graph capture jit 编程模型" },
        { id: "7-3", title: "Newton 数据模型：Model / State / Control / Contacts", file: "chapters/07-newton-foundations/7-3-data-model.html",
          keywords: "model state control contacts modelbuilder particle_q particle_qd step 契约 静态 动态 数据模型 finalize" },
        { id: "7-4", title: "一个最小 Newton 程序：builder → color → step", file: "chapters/07-newton-foundations/7-4-minimal-program.html",
          keywords: "minimal program builder color finalize state control contacts step loop collide 最小程序 主循环 example" },
      ],
    },
    {
      id: "p8",
      label: "Part 8",
      title: "从一根 strand 到一块 cloth · TinyVBD → Newton particle VBD",
      sections: [
        { id: "8-1", title: "同一个 min G(x)，搬上 GPU：什么没变、什么变了", file: "chapters/08-strand-to-cloth/8-1-same-min-G.html",
          keywords: "min G(x) gpu strand cloth 没变 变了 主线 桥 tinyvbd 串行 并行 incremental potential 一样" },
        { id: "8-2", title: "SolverVBD 全景：step() 的三段式", file: "chapters/08-strand-to-cloth/8-2-solver-overview.html",
          keywords: "solvervbd step initialize iterate finalize 三段式 全景 substep iteration 结构 particle" },
        { id: "8-3", title: "particle 的惯性初始化（对照 TinyVBD 自适应初始化）", file: "chapters/08-strand-to-cloth/8-3-initialization.html",
          keywords: "forward_step 惯性 初始化 inertia y predicted position 自适应 adaptive 差异 对照 没有 acceleration component" },
        { id: "8-4", title: "per-vertex Newton step 在 Warp 里：f_i 与 H_i 装配", file: "chapters/08-strand-to-cloth/8-4-newton-step-warp.html",
          keywords: "per vertex newton step f_i h_i hessian 3x3 solve_elasticity kernel 装配 assemble mass dt 惯性项 inverse delta x" },
        { id: "8-5", title: "graph coloring 与并行 sweep", file: "chapters/08-strand-to-cloth/8-5-coloring-parallel.html",
          keywords: "graph coloring 顶点着色 primal dual 颜色 parallel sweep gauss seidel jacobi 并行 串行 对照 color groups" },
      ],
    },
    {
      id: "p9",
      label: "Part 9",
      title: "真实的弹性与碰撞 · Real Elasticity & Collisions",
      sections: [
        { id: "9-1", title: "弹性元件谱：membrane / volumetric / bending / spring", file: "chapters/09-elasticity-collision/9-1-elastic-elements.html",
          keywords: "neo hookean membrane volumetric tet bending dihedral spring 弹性 元件 cloth soft 三角 fem 能量 对照 弹簧 hessian" },
        { id: "9-2", title: "SPD 投影与 Rayleigh damping：production 稳定性", file: "chapters/09-elasticity-collision/9-2-spd-damping.html",
          keywords: "spd 投影 projection rayleigh damping kd ke stable neo hookean lambda mu clamp 稳定性 production 阻尼" },
        { id: "9-3", title: "self-collision 与 penetration-free", file: "chapters/09-elasticity-collision/9-3-collision.html",
          keywords: "self collision bvh penetration free truncation dat vertex triangle edge edge 碰撞 穿透 截断 对照 无碰撞" },
      ],
    },
    {
      id: "p10",
      label: "Part 10",
      title: "AVBD 与 rigid · 收尾概览",
      sections: [
        { id: "10-1", title: "VBD 的软肋 → AVBD：augmented Lagrangian 与 penalty ramping", file: "chapters/10-avbd/10-1-avbd-idea.html",
          keywords: "avbd augmented vertex block descent lagrangian penalty ramping k_start beta gamma warm start hard soft 软肋 高刚度比 giles 2025" },
        { id: "10-2", title: "Newton 里的 rigid AVBD 一瞥，与进一步阅读", file: "chapters/10-avbd/10-2-rigid-and-further.html",
          keywords: "rigid avbd joints contacts newton 限制 软约束 进一步阅读 further reading 论文 docs demo 收尾 总结" },
      ],
    },
```

- [ ] **Step 2: Add appendix sections.** Inside the existing `pa` part's `sections: [...]` array, after the `a-3` references entry, add:

```js
        { id: "a-4", title: "Newton / Warp 术语表", file: "chapters/appendix/a-4-newton-glossary.html",
          keywords: "glossary 术语 newton warp kernel launch model state control coloring neo hookean avbd 词汇" },
        { id: "a-5", title: "TinyVBD ↔ Newton ↔ Isaac 对照速查", file: "chapters/appendix/a-5-mapping-cheatsheet.html",
          keywords: "mapping cheatsheet 对照 速查 tinyvbd newton isaac usd quaternion model state coloring 概念 映射" },
        { id: "a-6", title: "Newton / VBD / AVBD 参考文献", file: "chapters/appendix/a-6-newton-references.html",
          keywords: "references 参考文献 vbd avbd newton warp paper arxiv siggraph url 论文" },
```

- [ ] **Step 3: Verify content.js parses.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && node -e "global.window={}; require('./content.js'); const b=global.window.VBOOK; console.log('parts:', b.parts.map(p=>p.id).join(',')); console.log('flat count:', b.flat.length);"
```

Expected: `parts: p0,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,pa` and `flat count: 46` (29 original + 14 chapters + 3 appendix = 46).

- [ ] **Step 4: Record the canonical script block.** Create a reference snippet file the chapter tasks will copy. Create `learn/_SCRIPT_BLOCK.html` with EXACTLY this content (this is the bottom-of-page script block every NEW chapter uses; it loads all old + new widget scripts). Paths are for chapters at depth 2 (`chapters/<dir>/*.html`):

```html
  <script src="../../content.js"></script>
  <script src="../../assets/js/widgets/registry.js"></script>
  <script src="../../assets/js/widgets/vbd-core.js"></script>
  <script src="../../assets/js/widgets/euler-stability.js"></script>
  <script src="../../assets/js/widgets/potential-landscape.js"></script>
  <script src="../../assets/js/widgets/spring-hessian.js"></script>
  <script src="../../assets/js/widgets/pbd-stiffness.js"></script>
  <script src="../../assets/js/widgets/vbd-sweep.js"></script>
  <script src="../../assets/js/widgets/chebyshev.js"></script>
  <script src="../../assets/js/widgets/strand-lab.js"></script>
  <script src="../../assets/js/widgets/mass-ratio.js"></script>
  <script src="../../assets/js/widgets/warp-launch.js"></script>
  <script src="../../assets/js/widgets/graph-coloring.js"></script>
  <script src="../../assets/js/widgets/parallel-sweep.js"></script>
  <script src="../../assets/js/widgets/cloth-core.js"></script>
  <script src="../../assets/js/widgets/cloth-lab.js"></script>
  <script src="../../assets/js/widgets/avbd-penalty-ramp.js"></script>
  <script src="../../assets/js/book.js"></script>
```

- [ ] **Step 5: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/content.js learn/_SCRIPT_BLOCK.html && git commit -m "Append Newton Parts 7-10 + appendix to content.js nav"
```

---

### Task 3: Build a node DOM stub for headless widget testing

**Files:**
- Create: `learn/_tests/dom-stub.js`

This minimal stub lets widget code (`window.VBWidgets[name](root)`) run under node so we can test physics cores without a browser. It mirrors the approach used to verify the original book's widgets.

- [ ] **Step 1: Write the stub.** Create `learn/_tests/dom-stub.js`:

```js
// Minimal DOM + browser globals so widget IIFEs run under node for headless physics tests.
// Not a full DOM — just enough surface that registry.js / *-core.js / widget init don't crash.
function makeEl(tag) {
  const children = [];
  const el = {
    tagName: tag, children, style: {}, className: "", attributes: {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    appendChild(c) { children.push(c); return c; },
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    addEventListener() {}, removeEventListener() {},
    querySelector() { return makeEl("div"); },
    querySelectorAll() { return []; },
    getContext() { return makeCtx(); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 600, height: 360 }; },
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html || ""; },
    set textContent(v) { this._text = v; }, get textContent() { return this._text || ""; },
  };
  return el;
}
function makeCtx() {
  const noop = () => {};
  return new Proxy({ canvas: { width: 600, height: 360 } }, {
    get(t, p) { return p in t ? t[p] : noop; },
  });
}
global.window = global.window || {};
global.window.matchMedia = () => ({ matches: false });
global.window.devicePixelRatio = 1;
global.document = {
  createElement: makeEl,
  createElementNS: (_ns, tag) => makeEl(tag),
  documentElement: { style: { getPropertyValue: () => "#888" } },
};
global.getComputedStyle = () => ({ getPropertyValue: () => "#888" });
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
module.exports = { makeEl };
```

- [ ] **Step 2: Smoke-test the stub loads registry + an existing widget.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && node -e "require('./_tests/dom-stub.js'); require('./assets/js/widgets/registry.js'); require('./assets/js/widgets/vbd-core.js'); console.log('Strand defined:', typeof window.VBW.Strand);"
```

Expected: `Strand defined: function` (proves the stub + existing core load under node).

- [ ] **Step 3: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/_tests/dom-stub.js && git commit -m "Add node DOM stub for headless widget testing"
```

---

### Task 4: Build the cloth-core physics solver (2D triangle-mesh VBD)

**Files:**
- Create: `learn/assets/js/widgets/cloth-core.js`
- Test: `learn/_tests/cloth-core.test.js`

This is a faithful 2D port of Newton's particle VBD for a triangle mesh: per-vertex `Δx = H⁻¹f` with inertia + spring (stretch) + a simple bending term, solved by graph-colored Gauss-Seidel sweeps. Spring energy/force/Hessian forms match TinyVBD's `vbd-core.js` (which itself mirrors Newton's `accumulate_spring_force_and_hessian`). Keep it 2D (2×2 solves) for canvas. Read `learn/assets/js/widgets/vbd-core.js` first and mirror its structure/naming.

- [ ] **Step 1: Write the failing test.** Create `learn/_tests/cloth-core.test.js`:

```js
require("./dom-stub.js");
require("../assets/js/widgets/cloth-core.js");
const assert = require("assert");

const Cloth = window.VBW.Cloth;
assert.strictEqual(typeof Cloth, "function", "Cloth constructor exists");

// Build a small pinned cloth grid.
const cloth = new Cloth({ cols: 5, rows: 5, spacing: 0.1, stiffness: 1e3, gravity: -10, dt: 1 / 60 });
assert.ok(cloth.n === 25, "25 vertices");
assert.ok(cloth.edges.length > 0, "has edges");
assert.ok(Array.isArray(cloth.colors) && cloth.colors.length > 0, "has color groups");

// Coloring validity: no edge connects two same-color vertices.
const colorOf = new Int32Array(cloth.n).fill(-1);
cloth.colors.forEach((grp, ci) => grp.forEach((v) => (colorOf[v] = ci)));
for (const e of cloth.edges) {
  assert.notStrictEqual(colorOf[e.a], colorOf[e.b], "edge endpoints differ in color");
}

// Energy monotonicity: within a frame, more solve iterations never increases incremental potential G.
cloth.forwardStep();
const g0 = cloth.energy();
for (let i = 0; i < 10; i++) cloth.solveSweep();
const g1 = cloth.energy();
assert.ok(g1 <= g0 + 1e-9, `G should not increase: g0=${g0} g1=${g1}`);

// Rest stability: a flat cloth pinned at top, stepped once, stays finite (no NaN/explosion).
for (let f = 0; f < 30; f++) cloth.step(20);
let finite = true;
for (let i = 0; i < cloth.n; i++) if (!isFinite(cloth.px[i]) || !isFinite(cloth.py[i])) finite = false;
assert.ok(finite, "positions remain finite after 30 frames");

console.log("cloth-core: ALL PASS");
```

- [ ] **Step 2: Run the test to verify it fails.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && node _tests/cloth-core.test.js
```

Expected: FAIL — `Cannot find module '../assets/js/widgets/cloth-core.js'` (file not created yet).

- [ ] **Step 3: Implement cloth-core.js.** Create `learn/assets/js/widgets/cloth-core.js`. Mirror `vbd-core.js` style (IIFE registering onto `window.VBW`). Implement a 2D triangle-mesh VBD solver with these exact members the test relies on: constructor `Cloth(opts)` setting `this.n`, `this.px/py` (Float64Array positions), `this.edges` (`{a,b,l0,k}`), `this.colors` (array of arrays of vertex indices, greedily colored so no edge shares a color), and methods `forwardStep()`, `solveSweep()`, `energy()`, `step(iters)`. Reference math (same as `_NEWTON_BRIEF.md` / `vbd-core.js`):

```js
/* =========================================================================
   cloth-core.js — 一块 2D 三角网格的 Vertex Block Descent 求解器。
   是 Newton particle VBD（membrane/spring + bending）的 2D 忠实小型移植，
   对应 cloth-lab。结构对照 vbd-core.js（strand 版）。

   incremental potential:  G(x) = Σ m_i/(2h²)|x_i - y_i|²  +  Σ_e ½k_e(|x_a-x_b| - l0_e)²
   per-vertex Newton step:  Δx_i = H_i⁻¹ f_i  (2×2),  按 graph color 做 Gauss-Seidel sweep
   ========================================================================= */
(function () {
  function solve2x2(H, f) {
    const det = H[0] * H[3] - H[1] * H[2];
    if (Math.abs(det) < 1e-12) return [0, 0];
    const inv = 1 / det;
    return [inv * (H[3] * f[0] - H[1] * f[1]), inv * (-H[2] * f[0] + H[0] * f[1])];
  }

  function Cloth(opts) {
    opts = opts || {};
    this.cols = opts.cols || 11;
    this.rows = opts.rows || 11;
    this.spacing = opts.spacing != null ? opts.spacing : 0.08;
    this.stiffness = opts.stiffness != null ? opts.stiffness : 1e3;
    this.bend = opts.bend != null ? opts.bend : 0;     // bending stiffness (0 = off)
    this.gravity = opts.gravity != null ? opts.gravity : -10;
    this.dt = opts.dt != null ? opts.dt : 1 / 60;
    this.mass = opts.mass != null ? opts.mass : 1;
    this.build();
  }

  Cloth.prototype.build = function () {
    const cols = this.cols, rows = this.rows, s = this.spacing;
    this.n = cols * rows;
    this.px = new Float64Array(this.n); this.py = new Float64Array(this.n);
    this.ppx = new Float64Array(this.n); this.ppy = new Float64Array(this.n);
    this.vx = new Float64Array(this.n); this.vy = new Float64Array(this.n);
    this.yx = new Float64Array(this.n); this.yy = new Float64Array(this.n);
    this.m = new Float64Array(this.n);
    this.pinned = new Uint8Array(this.n);
    const idx = (r, c) => r * cols + c;
    // layout: hang from top row, world y up; top row y = 0, rows go downward (negative y)
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = idx(r, c);
      this.px[i] = (c - (cols - 1) / 2) * s;
      this.py[i] = -r * s;
      this.m[i] = this.mass;
      if (r === 0) this.pinned[i] = 1;        // top row pinned
    }
    // edges: structural (right + down) + shear (both diagonals) for triangle mesh
    this.edges = [];
    this.adj = Array.from({ length: this.n }, () => []);
    const addEdge = (a, b, k) => {
      const l0 = Math.hypot(this.px[a] - this.px[b], this.py[a] - this.py[b]);
      const e = { a, b, l0, k };
      this.edges.push(e); this.adj[a].push(e); this.adj[b].push(e);
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = idx(r, c);
      if (c + 1 < cols) addEdge(i, idx(r, c + 1), this.stiffness);
      if (r + 1 < rows) addEdge(i, idx(r + 1, c), this.stiffness);
      if (c + 1 < cols && r + 1 < rows) addEdge(i, idx(r + 1, c + 1), this.stiffness); // diagonal /
      if (c > 0 && r + 1 < rows) addEdge(i, idx(r + 1, c - 1), this.stiffness);        // diagonal \
    }
    // optional bending springs (skip-springs across 2 cells), analog to TinyVBD skip spring
    if (this.bend > 0) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = idx(r, c);
        if (c + 2 < cols) addEdge(i, idx(r, c + 2), this.bend);
        if (r + 2 < rows) addEdge(i, idx(r + 2, c), this.bend);
      }
    }
    this.colorGraph();
    this.savePrev();
  };

  // greedy vertex coloring: no edge connects two same-color vertices
  Cloth.prototype.colorGraph = function () {
    const color = new Int32Array(this.n).fill(-1);
    for (let v = 0; v < this.n; v++) {
      const used = new Set();
      for (const e of this.adj[v]) {
        const o = e.a === v ? e.b : e.a;
        if (color[o] >= 0) used.add(color[o]);
      }
      let cc = 0; while (used.has(cc)) cc++;
      color[v] = cc;
    }
    const ncolors = Math.max(0, ...color) + 1;
    this.colors = Array.from({ length: ncolors }, () => []);
    for (let v = 0; v < this.n; v++) this.colors[color[v]].push(v);
    this.colorOf = color;
  };

  Cloth.prototype.savePrev = function () {
    this.ppx.set(this.px); this.ppy.set(this.py);
  };

  // forward_step: y = x + (v + g*dt)*dt   (Newton's plain inertial init — NO adaptive init)
  Cloth.prototype.forwardStep = function () {
    const dt = this.dt;
    for (let i = 0; i < this.n; i++) {
      if (this.pinned[i]) { this.yx[i] = this.px[i]; this.yy[i] = this.py[i]; continue; }
      this.vy[i] += this.gravity * dt;
      this.yx[i] = this.px[i] + this.vx[i] * dt;
      this.yy[i] = this.py[i] + this.vy[i] * dt;
    }
    this.savePrev();
    for (let i = 0; i < this.n; i++) if (!this.pinned[i]) { this.px[i] = this.yx[i]; this.py[i] = this.yy[i]; }
  };

  // one colored Gauss-Seidel sweep: per vertex solve 2x2 H dx = f
  Cloth.prototype.solveSweep = function () {
    const dt2r = 1 / (this.dt * this.dt);
    for (const group of this.colors) {
      for (const v of group) {
        if (this.pinned[v]) continue;
        const mi = this.m[v];
        let fx = mi * (this.yx[v] - this.px[v]) * dt2r;
        let fy = mi * (this.yy[v] - this.py[v]) * dt2r;
        let h00 = mi * dt2r, h01 = 0, h10 = 0, h11 = mi * dt2r;
        for (const e of this.adj[v]) {
          const o = e.a === v ? e.b : e.a;
          let dx = this.px[v] - this.px[o], dy = this.py[v] - this.py[o];
          const l = Math.hypot(dx, dy) || 1e-9;
          const k = e.k, l0 = e.l0;
          // spring force on v: -k(l-l0) * d/l   (d points from o to v)
          const fmag = -k * (l - l0) / l;
          fx += fmag * dx; fy += fmag * dy;
          // spring Hessian block (2x2):  k[ I - (l0/l)(I - dd^T/l²) ]
          const dd = 1 / (l * l);
          const a = 1 - (l0 / l) * (1 - dx * dx * dd);
          const d = 1 - (l0 / l) * (1 - dy * dy * dd);
          const b = -(l0 / l) * (-dx * dy * dd);   // off-diagonal
          h00 += k * a; h11 += k * d; h01 += k * b; h10 += k * b;
        }
        const [ddx, ddy] = solve2x2([h00, h01, h10, h11], [fx, fy]);
        this.px[v] += ddx; this.py[v] += ddy;
      }
    }
  };

  // incremental potential G(x) (for monotonicity checks / display)
  Cloth.prototype.energy = function () {
    const dt2 = this.dt * this.dt; let G = 0;
    for (let i = 0; i < this.n; i++) {
      if (this.pinned[i]) continue;
      const ex = this.px[i] - this.yx[i], ey = this.py[i] - this.yy[i];
      G += this.m[i] / (2 * dt2) * (ex * ex + ey * ey);
    }
    for (const e of this.edges) {
      const l = Math.hypot(this.px[e.a] - this.px[e.b], this.py[e.a] - this.py[e.b]);
      G += 0.5 * e.k * (l - e.l0) * (l - e.l0);
    }
    return G;
  };

  Cloth.prototype.updateVelocity = function () {
    const dt = this.dt;
    for (let i = 0; i < this.n; i++) {
      if (this.pinned[i]) { this.vx[i] = 0; this.vy[i] = 0; continue; }
      this.vx[i] = (this.px[i] - this.ppx[i]) / dt;
      this.vy[i] = (this.py[i] - this.ppy[i]) / dt;
    }
  };

  Cloth.prototype.step = function (iters) {
    this.forwardStep();
    for (let k = 0; k < (iters || 20); k++) this.solveSweep();
    this.updateVelocity();
  };

  window.VBW = window.VBW || {};
  window.VBW.Cloth = Cloth;
})();
```

- [ ] **Step 4: Run the test to verify it passes.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && node _tests/cloth-core.test.js
```

Expected: `cloth-core: ALL PASS`. If energy monotonicity fails, the bug is almost always a sign error in the spring force or Hessian off-diagonal — recheck against `vbd-core.js`.

- [ ] **Step 5: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/assets/js/widgets/cloth-core.js learn/_tests/cloth-core.test.js && git commit -m "Add cloth-core: 2D triangle-mesh VBD solver + headless test"
```

---

### Task 5: Build the cloth-lab widget (render + interaction)

**Files:**
- Create: `learn/assets/js/widgets/cloth-lab.js`

Renders `VBW.Cloth` on a canvas with sliders (stiffness, iterations, bending) + drag interaction + a "show colors" toggle. Read `strand-lab.js` first and mirror its viewport/draw/drag scaffolding.

- [ ] **Step 1: Implement cloth-lab.js.** Create `learn/assets/js/widgets/cloth-lab.js`:

```js
/* cloth-lab — 一块真正在浏览器里跑 VBD 的 2D 三角网格 cloth。
   求解器来自 cloth-core.js（Newton particle VBD 的 2D 忠实移植）。
   可调 stiffness / 迭代数 / bending；可拖动顶点；可切换按 color 上色看并行分组。 */
(function () {
  window.VBWidgets["cloth-lab"] = function (root) {
    const W = 600, H = 420;
    const c = (n) => VBW.c(n);
    const state = { stiffness: 1e3, iters: 20, bendExp: -1, showColors: false, running: true };
    let cloth = null, dragIdx = -1;

    function rebuild() {
      cloth = new VBW.Cloth({
        cols: 13, rows: 13, spacing: 0.06,
        stiffness: state.stiffness, bend: state.bendExp <= -3 ? 0 : Math.pow(10, state.bendExp),
        gravity: -10, dt: 1 / 60, mass: 0.2,
      });
    }
    rebuild();

    const wx0 = -0.55, wx1 = 0.55, wy0 = -0.95, wy1 = 0.15;
    const sc = Math.min(W / (wx1 - wx0), H / (wy1 - wy0));
    const ox = (W - sc * (wx1 - wx0)) / 2, oy = (H - sc * (wy1 - wy0)) / 2;
    const X = (x) => ox + (x - wx0) * sc;
    const Y = (y) => H - oy - (y - wy0) * sc;
    const invX = (px) => (px - ox) / sc + wx0;
    const invY = (py) => (H - oy - py) / sc + wy0;

    const cv = VBW.el("canvas");
    const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px;cursor:grab";

    const palette = ["#0e7490", "#9333ea", "#c2660a", "#2563eb", "#dc2626", "#16a34a", "#db2777", "#0891b2"];

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.strokeStyle = c("border-strong");
      for (const e of cloth.edges) {
        ctx.beginPath();
        ctx.moveTo(X(cloth.px[e.a]), Y(cloth.py[e.a]));
        ctx.lineTo(X(cloth.px[e.b]), Y(cloth.py[e.b]));
        ctx.stroke();
      }
      for (let i = 0; i < cloth.n; i++) {
        ctx.beginPath();
        ctx.arc(X(cloth.px[i]), Y(cloth.py[i]), cloth.pinned[i] ? 4 : 2.6, 0, 2 * Math.PI);
        if (state.showColors) ctx.fillStyle = palette[cloth.colorOf[i] % palette.length];
        else ctx.fillStyle = cloth.pinned[i] ? c("warn") : c("interactive");
        ctx.fill();
      }
    }

    function frame() {
      if (state.running) cloth.step(state.iters);
      if (dragIdx >= 0) { cloth.vx[dragIdx] = 0; cloth.vy[dragIdx] = 0; }
      draw();
      raf = requestAnimationFrame(frame);
    }
    let raf = 0;

    // drag
    function pick(px, py) {
      const wx = invX(px), wy = invY(py); let best = -1, bd = 0.05;
      for (let i = 0; i < cloth.n; i++) {
        const d = Math.hypot(cloth.px[i] - wx, cloth.py[i] - wy);
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }
    cv.addEventListener("pointerdown", (ev) => {
      const r = cv.getBoundingClientRect();
      dragIdx = pick(ev.clientX - r.left, ev.clientY - r.top);
      if (dragIdx >= 0) cv.setPointerCapture(ev.pointerId);
    });
    cv.addEventListener("pointermove", (ev) => {
      if (dragIdx < 0) return;
      const r = cv.getBoundingClientRect();
      cloth.px[dragIdx] = invX(ev.clientX - r.left);
      cloth.py[dragIdx] = invY(ev.clientY - r.top);
    });
    cv.addEventListener("pointerup", () => { dragIdx = -1; });

    // controls
    const controls = VBW.el("div", { class: "ctrl-row" });
    const sStiff = VBW.slider("stiffness k", 2, 5, 0.1, Math.log10(state.stiffness),
      (v) => { state.stiffness = Math.pow(10, v); rebuild(); }, (v) => "1e" + v.toFixed(1));
    const sIter = VBW.slider("iterations", 1, 60, 1, state.iters, (v) => { state.iters = v; }, (v) => v | 0);
    const sBend = VBW.slider("bending", -3, 1, 0.5, state.bendExp,
      (v) => { state.bendExp = v; rebuild(); }, (v) => (v <= -3 ? "off" : "1e" + v.toFixed(1)));
    controls.appendChild(sStiff.wrap); controls.appendChild(sIter.wrap); controls.appendChild(sBend.wrap);
    const row2 = VBW.el("div", { class: "ctrl-row" });
    row2.appendChild(VBW.toggle("show colors", state.showColors, (v) => { state.showColors = v; }));
    row2.appendChild(VBW.toggle("running", state.running, (v) => { state.running = v; }));
    const reset = VBW.el("button", { class: "btn" }, "reset");
    reset.addEventListener("click", () => rebuild());
    row2.appendChild(reset);

    root.appendChild(cv);
    root.appendChild(controls);
    root.appendChild(row2);
    frame();
  };
})();
```

- [ ] **Step 2: Smoke-test it mounts under the stub.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && node -e "require('./_tests/dom-stub.js'); window.VBWidgets={}; require('./assets/js/widgets/registry.js'); require('./assets/js/widgets/cloth-core.js'); require('./assets/js/widgets/cloth-lab.js'); const {makeEl}=require('./_tests/dom-stub.js'); window.VBWidgets['cloth-lab'](makeEl('div')); console.log('cloth-lab mounted OK');"
```

Expected: `cloth-lab mounted OK` (no throw — proves init runs end-to-end headless).

- [ ] **Step 3: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/assets/js/widgets/cloth-lab.js && git commit -m "Add cloth-lab widget: interactive 2D cloth VBD playground"
```

---

### Task 6: Build the graph-coloring widget (+ test)

**Files:**
- Create: `learn/assets/js/widgets/graph-coloring.js`
- Test: `learn/_tests/graph-coloring.test.js`

Shows a 2D triangle mesh, greedily colors **vertices** (primal) vs **constraints/edges** (dual), and reports the color count for each — making concrete why vertex coloring yields fewer colors. The coloring algorithm lives in a testable helper on `window.VBW`.

- [ ] **Step 1: Write the failing test.** Create `learn/_tests/graph-coloring.test.js`:

```js
require("./dom-stub.js");
require("../assets/js/widgets/graph-coloring.js");
const assert = require("assert");

const gc = window.VBW.greedyColor;
assert.strictEqual(typeof gc, "function", "greedyColor helper exists");

// triangle: 3 nodes, 3 edges (a complete graph K3) -> needs 3 colors
const adj3 = [[1, 2], [0, 2], [0, 1]];
const res3 = gc(adj3);
assert.strictEqual(Math.max(...res3) + 1, 3, "K3 needs 3 colors");

// a path of 4 nodes -> 2 colors
const adjPath = [[1], [0, 2], [1, 3], [2]];
assert.strictEqual(Math.max(...gc(adjPath)) + 1, 2, "path needs 2 colors");

// validity: no edge shares a color, on a small grid built by the widget helper
const { vertAdj, edgeAdj } = window.VBW.buildMeshGraphs(5, 5);
const vc = gc(vertAdj), ec = gc(edgeAdj);
for (let v = 0; v < vertAdj.length; v++)
  for (const o of vertAdj[v]) assert.notStrictEqual(vc[v], vc[o], "vertex coloring valid");
// On a triangle mesh the dual (edge) graph generally needs >= as many colors as the primal.
assert.ok(Math.max(...ec) + 1 >= Math.max(...vc) + 1, "dual colors >= primal colors");

console.log("graph-coloring: ALL PASS");
```

- [ ] **Step 2: Run to verify it fails.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && node _tests/graph-coloring.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement graph-coloring.js.** Create `learn/assets/js/widgets/graph-coloring.js` with the testable helpers plus the widget. The widget itself can be a compact canvas render; the critical, tested part is `greedyColor` + `buildMeshGraphs`:

```js
/* graph-coloring — 在一块 2D 三角网格上做顶点着色(primal) vs 约束/边着色(dual)，
   数出各自的颜色数，直观说明：顶点图的颜色远少于约束图 → 更多并行。 */
(function () {
  // greedy graph coloring: adj is array of neighbor-index arrays. returns Int32Array of colors.
  function greedyColor(adj) {
    const n = adj.length, color = new Int32Array(n).fill(-1);
    for (let v = 0; v < n; v++) {
      const used = new Set();
      for (const o of adj[v]) if (color[o] >= 0) used.add(color[o]);
      let cc = 0; while (used.has(cc)) cc++;
      color[v] = cc;
    }
    return color;
  }

  // build primal (vertex) and dual (edge/constraint) adjacency for a cols×rows triangle mesh.
  function buildMeshGraphs(cols, rows) {
    const idx = (r, c) => r * cols + c;
    const n = cols * rows;
    const edges = [];
    const vertAdjSet = Array.from({ length: n }, () => new Set());
    const addE = (a, b) => { edges.push([a, b]); vertAdjSet[a].add(b); vertAdjSet[b].add(a); };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = idx(r, c);
      if (c + 1 < cols) addE(i, idx(r, c + 1));
      if (r + 1 < rows) addE(i, idx(r + 1, c));
      if (c + 1 < cols && r + 1 < rows) addE(i, idx(r + 1, c + 1));
    }
    const vertAdj = vertAdjSet.map((s) => [...s]);
    // dual: two edges are adjacent if they share a vertex
    const edgesOfVert = Array.from({ length: n }, () => []);
    edges.forEach(([a, b], ei) => { edgesOfVert[a].push(ei); edgesOfVert[b].push(ei); });
    const edgeAdjSet = Array.from({ length: edges.length }, () => new Set());
    for (let v = 0; v < n; v++) {
      const es = edgesOfVert[v];
      for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
        edgeAdjSet[es[i]].add(es[j]); edgeAdjSet[es[j]].add(es[i]);
      }
    }
    const edgeAdj = edgeAdjSet.map((s) => [...s]);
    return { edges, vertAdj, edgeAdj };
  }

  window.VBW = window.VBW || {};
  window.VBW.greedyColor = greedyColor;
  window.VBW.buildMeshGraphs = buildMeshGraphs;

  window.VBWidgets = window.VBWidgets || {};
  window.VBWidgets["graph-coloring"] = function (root) {
    const W = 560, H = 320, cols = 8, rows = 6, s = 60, x0 = 60, y0 = 40;
    const c = (n) => VBW.c(n);
    const { edges, vertAdj, edgeAdj } = buildMeshGraphs(cols, rows);
    const vColor = greedyColor(vertAdj), eColor = greedyColor(edgeAdj);
    const nV = Math.max(...vColor) + 1, nE = Math.max(...eColor) + 1;
    const palette = ["#0e7490", "#9333ea", "#c2660a", "#2563eb", "#dc2626", "#16a34a", "#db2777", "#0891b2", "#7c3aed", "#ea580c"];
    let mode = "primal";
    const idx = (r, cc) => r * cols + cc;
    const P = (i) => ({ x: x0 + (i % cols) * s, y: y0 + Math.floor(i / cols) * s });

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1.5;
      edges.forEach(([a, b], ei) => {
        ctx.strokeStyle = mode === "dual" ? palette[eColor[ei] % palette.length] : c("border-strong");
        const pa = P(a), pb = P(b);
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      });
      for (let i = 0; i < cols * rows; i++) {
        const p = P(i);
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = mode === "primal" ? palette[vColor[i] % palette.length] : c("ink-faint");
        ctx.fill();
      }
    }
    const cap = VBW.el("div", { class: "lab-cap" });
    function updateCap() {
      cap.innerHTML = mode === "primal"
        ? "顶点图(primal)：<b>" + nV + "</b> colors —— 同色顶点可并行更新。"
        : "约束图(dual)：<b>" + nE + "</b> colors —— 约束更多、连接更密，颜色更多。";
    }
    const seg = VBW.seg(
      [{ label: "顶点 primal", value: "primal" }, { label: "约束 dual", value: "dual" }],
      mode, (v) => { mode = v; draw(); updateCap(); });
    root.appendChild(cv); root.appendChild(seg); root.appendChild(cap);
    draw(); updateCap();
  };
})();
```

- [ ] **Step 4: Run the test to verify it passes.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && node _tests/graph-coloring.test.js
```

Expected: `graph-coloring: ALL PASS`.

- [ ] **Step 5: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/assets/js/widgets/graph-coloring.js learn/_tests/graph-coloring.test.js && git commit -m "Add graph-coloring widget (primal vs dual) + test"
```

---

### Task 7: Build warp-launch, parallel-sweep, avbd-penalty-ramp widgets

**Files:**
- Create: `learn/assets/js/widgets/warp-launch.js`
- Create: `learn/assets/js/widgets/parallel-sweep.js`
- Create: `learn/assets/js/widgets/avbd-penalty-ramp.js`

These three are illustrative (no heavy physics core), so a mount smoke-test under the stub is sufficient.

- [ ] **Step 1: Implement warp-launch.js.** Create `learn/assets/js/widgets/warp-launch.js`:

```js
/* warp-launch — SPMD 心智模型小可视化。一个 wp.launch(kernel, dim=N) 启动 N 个 thread，
   每个 thread 用 tid=wp.tid() 取自己那一份数据，互不干扰。点一个格子看它的 tid 与读写的元素。 */
(function () {
  window.VBWidgets["warp-launch"] = function (root) {
    const N = 16, cols = 8;
    const c = (n) => VBW.c(n);
    let active = -1;
    const grid = VBW.el("div", { style: "display:grid;grid-template-columns:repeat(" + cols + ",1fr);gap:6px;margin:auto;max-width:520px" });
    const cells = [];
    for (let i = 0; i < N; i++) {
      const cell = VBW.el("div", { style: "aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:.8rem;cursor:pointer;background:var(--surface-2);border:1px solid var(--border)" }, String(i));
      cell.addEventListener("click", () => { active = i; render(); });
      cells.push(cell); grid.appendChild(cell);
    }
    const info = VBW.el("div", { class: "lab-cap" });
    function render() {
      cells.forEach((cell, i) => {
        const on = i === active;
        cell.style.background = on ? "var(--interactive)" : "var(--surface-2)";
        cell.style.color = on ? "#fff" : "var(--ink-soft)";
        cell.style.borderColor = on ? "var(--interactive)" : "var(--border)";
      });
      info.innerHTML = active < 0
        ? "<code>wp.launch(kernel, dim=" + N + ")</code> 启动 " + N + " 个 thread。点一个格子看它做什么。"
        : "thread <b>tid=" + active + "</b> 执行 <code>x[" + active + "] = f(x[" + active + "])</code> —— 只碰自己那份数据，和其它 " + (N - 1) + " 个 thread 并行。";
    }
    root.appendChild(grid); root.appendChild(info); render();
  };
})();
```

- [ ] **Step 2: Implement parallel-sweep.js.** Create `learn/assets/js/widgets/parallel-sweep.js`:

```js
/* parallel-sweep — 按 color 的并行 Gauss-Seidel 动画：同色顶点同时更新、颜色依次推进，
   与 TinyVBD 串行(一次一个顶点) sweep 并排。说明颜色数 = 串行阶段数。 */
(function () {
  window.VBWidgets["parallel-sweep"] = function (root) {
    const c = (n) => VBW.c(n);
    const cols = 9, rows = 5, n = cols * rows;
    // 2-coloring of a grid (checkerboard) for the "parallel" panel
    const colorOf = new Int32Array(n);
    for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) colorOf[r * cols + cc] = (r + cc) % 2;
    const ncolors = 2;
    const W = 560, H = 260, s = 56, x0 = 40, y0 = 40;
    const P = (i) => ({ x: x0 + (i % cols) * s, y: y0 + Math.floor(i / cols) * s });
    const palette = ["#0e7490", "#9333ea"];
    let phase = 0, serialIdx = 0, mode = "parallel", t = 0;
    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < n; i++) {
        const p = P(i);
        let on;
        if (mode === "parallel") on = colorOf[i] === phase;
        else on = i === serialIdx;
        ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 2 * Math.PI);
        ctx.fillStyle = on ? palette[colorOf[i]] : "var(--border-strong)";
        ctx.fillStyle = on ? palette[colorOf[i]] : c("border-strong");
        ctx.fill();
        if (on) { ctx.lineWidth = 3; ctx.strokeStyle = c("ink"); ctx.stroke(); }
      }
    }
    const cap = VBW.el("div", { class: "lab-cap" });
    function updateCap() {
      cap.innerHTML = mode === "parallel"
        ? "并行：当前更新 color <b>" + phase + "</b> 的所有顶点（同时）。" + ncolors + " 个 color → 每个 sweep 只有 " + ncolors + " 个串行阶段。"
        : "串行(TinyVBD 式)：一次只更新一个顶点 #" + serialIdx + "。" + n + " 个顶点 → " + n + " 个串行阶段。";
    }
    function tick() {
      t++;
      if (t % 30 === 0) {
        if (mode === "parallel") phase = (phase + 1) % ncolors;
        else serialIdx = (serialIdx + 1) % n;
        draw(); updateCap();
      }
      raf = requestAnimationFrame(tick);
    }
    let raf = 0;
    const seg = VBW.seg(
      [{ label: "并行 by color", value: "parallel" }, { label: "串行 TinyVBD", value: "serial" }],
      mode, (v) => { mode = v; phase = 0; serialIdx = 0; draw(); updateCap(); });
    root.appendChild(cv); root.appendChild(seg); root.appendChild(cap);
    draw(); updateCap(); tick();
  };
})();
```

- [ ] **Step 3: Implement avbd-penalty-ramp.js.** Create `learn/assets/js/widgets/avbd-penalty-ramp.js`. The math is the warm-start/ramp from `_NEWTON_BRIEF.md` (AVBD Eq.17, defaults α=0.95, β=10, γ=0.99):

```js
/* avbd-penalty-ramp — AVBD 的 penalty stiffness 演化：每帧 warm-start 衰减 (k ← max(γk, k_start))，
   迭代内对仍违反的约束以 β 增长；soft 约束封顶在材料刚度，hard 约束可冲向无穷。调参看曲线。 */
(function () {
  window.VBWidgets["avbd-penalty-ramp"] = function (root) {
    const W = 560, H = 300, c = (n) => VBW.c(n);
    const state = { gamma: 0.99, beta: 10, kStartExp: 3, hard: true, kMatExp: 6 };
    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    // simulate k over frames×iters; constraint stays "violated" so it keeps ramping each iter
    function simulate() {
      const kStart = Math.pow(10, state.kStartExp);
      const kCap = state.hard ? Infinity : Math.pow(10, state.kMatExp);
      const frames = 8, iters = 6;
      const series = []; let k = kStart;
      for (let f = 0; f < frames; f++) {
        k = Math.max(state.gamma * k, kStart);     // warm-start decay, floored at k_start
        for (let it = 0; it < iters; it++) {
          k = Math.min(k * state.beta, kCap);       // ramp for still-violated constraint
          series.push(k);
        }
      }
      return series;
    }
    function draw() {
      const series = simulate();
      ctx.clearRect(0, 0, W, H);
      const pad = 40, plotW = W - pad * 2, plotH = H - pad * 2;
      const logs = series.map((v) => Math.log10(v === Infinity ? 1e12 : v));
      const lo = state.kStartExp - 0.5, hi = Math.max(state.kMatExp, 8) + 0.5;
      const Xp = (i) => pad + (i / (series.length - 1)) * plotW;
      const Yp = (lv) => pad + plotH - ((lv - lo) / (hi - lo)) * plotH;
      // material cap line (soft only)
      if (!state.hard) {
        ctx.strokeStyle = c("warn"); ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(pad, Yp(state.kMatExp)); ctx.lineTo(W - pad, Yp(state.kMatExp)); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = c("interactive"); ctx.lineWidth = 2; ctx.beginPath();
      logs.forEach((lv, i) => { const x = Xp(i), y = Yp(lv); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      ctx.fillStyle = c("ink-faint"); ctx.font = "12px var(--mono)";
      ctx.fillText("log10(k)", 6, 16); ctx.fillText("frames × iters →", W - 130, H - 10);
    }
    const r1 = VBW.el("div", { class: "ctrl-row" });
    r1.appendChild(VBW.slider("γ (warm-start decay)", 0.8, 1.0, 0.01, state.gamma, (v) => { state.gamma = v; draw(); }, (v) => v.toFixed(2)).wrap);
    r1.appendChild(VBW.slider("β (growth)", 2, 20, 1, state.beta, (v) => { state.beta = v; draw(); }, (v) => "×" + (v | 0)).wrap);
    r1.appendChild(VBW.slider("k_start", 1, 5, 0.5, state.kStartExp, (v) => { state.kStartExp = v; draw(); }, (v) => "1e" + v.toFixed(1)).wrap);
    const r2 = VBW.el("div", { class: "ctrl-row" });
    r2.appendChild(VBW.toggle("hard 约束", state.hard, (v) => { state.hard = v; draw(); }));
    r2.appendChild(VBW.slider("材料刚度 (soft 封顶)", 4, 9, 0.5, state.kMatExp, (v) => { state.kMatExp = v; draw(); }, (v) => "1e" + v.toFixed(1)).wrap);
    root.appendChild(cv); root.appendChild(r1); root.appendChild(r2);
    draw();
  };
})();
```

- [ ] **Step 4: Smoke-test all three mount under the stub.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && node -e "
require('./_tests/dom-stub.js'); const {makeEl}=require('./_tests/dom-stub.js');
window.VBWidgets={}; require('./assets/js/widgets/registry.js');
['warp-launch','parallel-sweep','avbd-penalty-ramp'].forEach(w=>{
  require('./assets/js/widgets/'+w+'.js');
  window.VBWidgets[w](makeEl('div'));
  console.log(w+' mounted OK');
});"
```

Expected: three lines `… mounted OK`.

- [ ] **Step 5: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/assets/js/widgets/warp-launch.js learn/assets/js/widgets/parallel-sweep.js learn/assets/js/widgets/avbd-penalty-ramp.js && git commit -m "Add warp-launch, parallel-sweep, avbd-penalty-ramp widgets"
```

---

### Task 8: Write the FACTS doc `_NEWTON_BRIEF.md`

**Files:**
- Create: `learn/_NEWTON_BRIEF.md`

This is the single fact-source for all Part 7–10 chapter authors. It must consolidate the three research digests (particle VBD code, Newton+Warp architecture, external papers) with `file:line` / URL citations, the writing conventions (copied/adapted from `_AGENT_BRIEF.md`), the widget-to-chapter assignment, and an explicit "do not state these unverified numbers" list.

- [ ] **Step 1: Write `_NEWTON_BRIEF.md`** with these sections (fill with the verified content gathered during research — the agent writing this task has the three digests in context or must re-derive from the cited files):

  1. **写作 BRIEF**: audience (knows TinyVBD + Isaac/USD, not Newton/Warp), tone (中文叙述 + 英文术语), the three bridges (g103/pbd/**tinyvbd**), Isaac/USD note via `callout note`, the main throughline sentence, HTML rules (copy golden reference + the canonical script block from `_SCRIPT_BLOCK.html`), `data-section`/`data-root`/`id` rules, code block format (`data-lang="python"` for Newton/Warp, `data-lang="cpp"` for TinyVBD), KaTeX rules.
  2. **Widget→chapter assignment** (matching content.js): warp-launch→7-2; graph-coloring + parallel-sweep→8-5; cloth-lab→9-1; avbd-penalty-ramp→10-1; reuse strand-lab→8-1, vbd-sweep→8-4, mass-ratio→10-1. No widget elsewhere.
  3. **FACTS — Newton/Warp 架构** (from the architecture digest): what Newton is + relationships (README.md:8-11); Warp model (`@wp.kernel`/`wp.func`/`wp.array`/`wp.launch`/`wp.tid`/`wp.vec3`/`wp.mat33`/CUDA graph); Model/State/Control/Contacts/ModelBuilder roles + the `step(state_in,state_out,control,contacts,dt)` contract; `builder.color()` + `particle_color_groups`; minimal program from `example_basic_pendulum.py`; Isaac↔Newton mapping incl. quaternion `(x,y,z,w)` vs `(w,x,y,z)`. All with `file:line`.
  4. **FACTS — particle VBD code** (from the code digest): `SolverVBD.step()` 3-phase Initialize/Iterate/Finalize; `forward_step` plain inertial init `y=x+v·dt` (particle_vbd_kernels.py:1783-1808) — explicitly NOT adaptive like TinyVBD; per-vertex assembly `f = mass*(y-x)/dt²`, `h = mass/dt²·I` + elastic blocks, `Δx = H⁻¹f` (solve_elasticity ~3136-3274); colored Gauss-Seidel over `particle_color_groups` (_solve_particle_iteration 2154-2340); **no Chebyshev**; elastic elements: Neo-Hookean membrane (864-1024), volumetric (334-467), dihedral bending (1057-1189), springs; Rayleigh `D=kd·ke`; SPD clamp; self-collision BVH + penetration-free truncation (tri_mesh_collision.py; _penetration_free_truncation 1672-1732). All with `file:line`.
  5. **FACTS — VBD/AVBD papers** (from external digest, only verified items): VBD 2024 (arXiv:2403.06321; Chen, Liu, Yang, Yuksel; TOG 43(4) Art.116); core algorithm; Chebyshev accel (Wang 2015) in the paper but not in Newton's particle path; AVBD 2025 (TOG 44(4) Art.90; Giles, Diaz, Yuksel; DOI 10.1145/3731195); augmented Lagrangian, hard/soft, penalty ramp defaults α=0.95, β=10, γ=0.99, k_start; Newton solver params `rigid_avbd_gamma`/`rigid_contact_k_start`. URLs from the Sources list.
  6. **DO-NOT-STATE list** (unverified, WebFetch was blocked): specific VBD timing numbers (3.6/3.9s etc.), graph-coloring reduction factors (4×/48×), MuJoCo Warp 252×/475×, AVBD arXiv id, "Newton 1.0" milestone. These must not appear as fact in prose.

- [ ] **Step 2: Sanity-check citations resolve.** Spot-check 3 cited lines exist:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/newton && sed -n '1783,1790p' newton/_src/solvers/vbd/particle_vbd_kernels.py && echo "---" && sed -n '8,11p' README.md
```

Expected: forward_step kernel code around 1783; README lines 8-11 describing Newton-on-Warp. (If line numbers drifted, fix the citations in the brief.)

- [ ] **Step 3: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/_NEWTON_BRIEF.md && git commit -m "Add _NEWTON_BRIEF.md FACTS doc for Newton chapters"
```

---

### Task 9: Write Part 7 chapters (Newton/Warp foundations)

**Files:**
- Create: `learn/chapters/07-newton-foundations/7-1-what-is-newton.html`
- Create: `learn/chapters/07-newton-foundations/7-2-warp-model.html`
- Create: `learn/chapters/07-newton-foundations/7-3-data-model.html`
- Create: `learn/chapters/07-newton-foundations/7-4-minimal-program.html`

**Method:** This task (and Tasks 10–13) is best dispatched to subagents (one per chapter, parallelizable) seeded with `_NEWTON_BRIEF.md` + the golden reference files. Each subagent prompt: "Read `learn/_NEWTON_BRIEF.md`, `learn/_AGENT_BRIEF.md`, the golden reference chapter, and `learn/_SCRIPT_BLOCK.html`. Write `<this file>` as a complete HTML chapter following all rules. Target ~900–1500 中文字 body + math/code/callouts/bridges + the assigned widget. Use only facts in `_NEWTON_BRIEF.md` or code you Read. data-section must match the chapter id."

- [ ] **Step 1: Create the directory.** Run: `mkdir -p /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn/chapters/07-newton-foundations`

- [ ] **Step 2: Write 7-1** (`data-section="7-1"`): What Newton is — Isaac/USD/PhysX → Warp-native engine; relationships to Warp/`warp.sim`/MuJoCo Warp/Isaac Lab/OpenUSD; why VBD/AVBD live here. Use an Isaac/USD `callout note` and a `bridge tinyvbd` connecting "你那根 strand 的 simulate() 主循环" to Newton's solver.step contract preview. No widget.

- [ ] **Step 3: Write 7-2** (`data-section="7-2"`): The Warp programming model — `@wp.kernel`/`@wp.func`/`wp.array`/`wp.launch`/`wp.tid()`, SPMD per-thread mental model, `wp.vec3`/`wp.mat33`, one CUDA-graph sentence. Embed the **warp-launch** widget. Use a real kernel snippet from `particle_vbd_kernels.py` (`data-lang="python"`).

- [ ] **Step 4: Write 7-3** (`data-section="7-3"`): Newton data model — `Model`(static) / `State`(`particle_q/qd`) / `Control` / `Contacts` / `ModelBuilder`; the `step(state_in,state_out,control,contacts,dt)` contract. `callout note` mapping to Isaac root-state/USD stage. No widget.

- [ ] **Step 5: Write 7-4** (`data-section="7-4"`): Minimal Newton program — `builder → color() → finalize → state/control/contacts → step loop`, reconstructed from `example_basic_pendulum.py`, pointing to a cloth/particle example. `bridge tinyvbd` mapping each line to TinyVBD's `simulate()`. No widget.

- [ ] **Step 6: Verify chapters load in nav + reference real files.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && for f in 7-1-what-is-newton 7-2-warp-model 7-3-data-model 7-4-minimal-program; do test -f chapters/07-newton-foundations/$f.html && grep -q 'data-section="7-' chapters/07-newton-foundations/$f.html && echo "$f OK" || echo "$f MISSING/BAD"; done
```

Expected: four `… OK` lines.

- [ ] **Step 7: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/chapters/07-newton-foundations && git commit -m "Write Part 7: Newton + Warp foundations"
```

---

### Task 10: Write Part 8 chapters (TinyVBD → Newton particle VBD)

**Files:**
- Create: `learn/chapters/08-strand-to-cloth/8-1-same-min-G.html` … `8-5-coloring-parallel.html`

Same subagent method as Task 9.

- [ ] **Step 1: Create the directory.** Run: `mkdir -p /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn/chapters/08-strand-to-cloth`

- [ ] **Step 2: Write 8-1** (`data-section="8-1"`): Same `min G(x)`, on GPU — what's unchanged/changed; establishes the throughline. Embed reused **strand-lab** as the "回顾你已懂的" hook. Heavy `bridge tinyvbd`.

- [ ] **Step 3: Write 8-2** (`data-section="8-2"`): `SolverVBD` overview — `step()`'s 3-phase Initialize/Iterate/Finalize; substep/iteration structure. No widget (or a static diagram).

- [ ] **Step 4: Write 8-3** (`data-section="8-3"`): Particle inertial init (`forward_step` kernel) vs TinyVBD adaptive init — explicitly call out the difference (Newton uses plain `y=x+v·dt`). `bridge tinyvbd`. `data-lang="python"` snippet.

- [ ] **Step 5: Write 8-4** (`data-section="8-4"`): Per-vertex Newton step in Warp — `f_i`/`H_i`(3×3) assembly + `Δx=H⁻¹f`; quote `solve_elasticity` inertia terms `mass*(y-x)/dt²` + `mass/dt²·I`. Embed reused **vbd-sweep** (serial contrast). `bridge tinyvbd` to TinyVBD's `solve()`.

- [ ] **Step 6: Write 8-5** (`data-section="8-5"`): Graph coloring + parallel sweep — color-driven Gauss-Seidel, primal vs dual, parallel vs serial. Embed **graph-coloring** AND **parallel-sweep**.

- [ ] **Step 7: Verify.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && ls chapters/08-strand-to-cloth/*.html | wc -l && grep -l 'data-widget="graph-coloring"' chapters/08-strand-to-cloth/8-5-coloring-parallel.html && grep -l 'data-widget="parallel-sweep"' chapters/08-strand-to-cloth/8-5-coloring-parallel.html
```

Expected: `5`, then the 8-5 path printed twice (both widgets embedded).

- [ ] **Step 8: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/chapters/08-strand-to-cloth && git commit -m "Write Part 8: from strand to cloth (particle VBD)"
```

---

### Task 11: Write Part 9 chapters (real elasticity & collisions)

**Files:**
- Create: `learn/chapters/09-elasticity-collision/9-1-elastic-elements.html`, `9-2-spd-damping.html`, `9-3-collision.html`

Same subagent method.

- [ ] **Step 1: Create the directory.** Run: `mkdir -p /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn/chapters/09-elasticity-collision`

- [ ] **Step 2: Write 9-1** (`data-section="9-1"`): Elastic element spectrum — Neo-Hookean membrane/volumetric, dihedral bending, springs; contrast TinyVBD's spring Hessian. **This is the cloth-lab capstone** — embed **cloth-lab** prominently. `data-lang="python"` snippets from the membrane/bending kernels.

- [ ] **Step 3: Write 9-2** (`data-section="9-2"`): SPD projection + Rayleigh damping — `D=kd·ke`, stable Neo-Hookean `λ_NH=λ+μ`, Hessian SPD clamp. `callout warn` about why production needs SPD projection. No widget.

- [ ] **Step 4: Write 9-3** (`data-section="9-3"`): Self-collision + penetration-free — BVH, vertex-triangle/edge-edge, DAT truncation; contrast TinyVBD "no collision". No widget.

- [ ] **Step 5: Verify cloth-lab is embedded.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && grep -l 'data-widget="cloth-lab"' chapters/09-elasticity-collision/9-1-elastic-elements.html && ls chapters/09-elasticity-collision/*.html | wc -l
```

Expected: the 9-1 path, then `3`.

- [ ] **Step 6: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/chapters/09-elasticity-collision && git commit -m "Write Part 9: real elasticity and collisions"
```

---

### Task 12: Write Part 10 chapters (AVBD + rigid overview)

**Files:**
- Create: `learn/chapters/10-avbd/10-1-avbd-idea.html`, `10-2-rigid-and-further.html`

Same subagent method.

- [ ] **Step 1: Create the directory.** Run: `mkdir -p /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn/chapters/10-avbd`

- [ ] **Step 2: Write 10-1** (`data-section="10-1"`): VBD limits (high stiffness ratio, hard constraints, penetration) → AVBD — augmented Lagrangian, penalty ramping (`k_start`/`β`/`γ`, warm-start decay + per-iter growth, hard vs soft cap). Embed **avbd-penalty-ramp**. Reuse **mass-ratio** for the "软肋回顾" callback. `bridge tinyvbd` back to the high-mass-ratio experiment the reader already ran.

- [ ] **Step 3: Write 10-2** (`data-section="10-2"`): Newton's rigid AVBD glimpse — joints/contacts, its place in the engine, Newton's current limitation (rigid uses soft constraints w/ adaptive penalties); "进一步阅读" closing (VBD/AVBD papers, Newton docs, demos). No widget.

- [ ] **Step 4: Verify.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && ls chapters/10-avbd/*.html | wc -l && grep -l 'data-widget="avbd-penalty-ramp"' chapters/10-avbd/10-1-avbd-idea.html
```

Expected: `2`, then the 10-1 path.

- [ ] **Step 5: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/chapters/10-avbd && git commit -m "Write Part 10: AVBD and rigid overview"
```

---

### Task 13: Write appendix pages (glossary, mapping, references)

**Files:**
- Create: `learn/chapters/appendix/a-4-newton-glossary.html`, `a-5-mapping-cheatsheet.html`, `a-6-newton-references.html`

Same subagent method. These reference existing appendix files (`a-1-glossary.html` etc.) as golden references for appendix styling.

- [ ] **Step 1: Write a-4** (`data-section="a-4"`): Newton/Warp glossary — `wp.kernel`, `wp.launch`, `Model`, `State`, `Control`, `Contacts`, `ModelBuilder`, coloring, Neo-Hookean, AVBD, etc. Table or definition-list, same style as `a-1-glossary.html`.

- [ ] **Step 2: Write a-5** (`data-section="a-5"`): `TinyVBD ↔ Newton ↔ Isaac` mapping cheatsheet — a `<table>` (strand→cloth, `solve()`→`solve_elasticity`, adaptive init→inertial init, no-collision→BVH+truncation, Chebyshev→none; Model/State↔Isaac/USD; quaternion order gotcha).

- [ ] **Step 3: Write a-6** (`data-section="a-6"`): References — VBD 2024 (arXiv:2403.06321), AVBD 2025 (DOI 10.1145/3731195), Newton docs, Warp docs, project pages. Only verified URLs from `_NEWTON_BRIEF.md` Sources. Same style as `a-3-references.html`.

- [ ] **Step 4: Verify.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && for f in a-4-newton-glossary a-5-mapping-cheatsheet a-6-newton-references; do test -f chapters/appendix/$f.html && echo "$f OK" || echo "$f MISSING"; done
```

Expected: three `… OK` lines.

- [ ] **Step 5: Commit.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add learn/chapters/appendix && git commit -m "Write appendix: Newton glossary, mapping cheatsheet, references"
```

---

### Task 14: Full integration verification

**Files:** (no new files; verification + fixes only)

- [ ] **Step 1: Verify every content.js file path exists on disk.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && node -e "
global.window={}; require('./content.js');
const fs=require('fs'); let bad=0;
global.window.VBOOK.flat.forEach(s=>{ if(!fs.existsSync(s.file)){ console.log('MISSING',s.file); bad++; } });
console.log(bad? bad+' missing':'ALL '+global.window.VBOOK.flat.length+' files present');"
```

Expected: `ALL 46 files present`.

- [ ] **Step 2: Verify every new chapter loads the full script block (all widget scripts present).** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && for f in $(find chapters/0[789]* chapters/10-avbd -name '*.html'); do for w in warp-launch graph-coloring parallel-sweep cloth-core cloth-lab avbd-penalty-ramp; do grep -q "widgets/$w.js" "$f" || echo "$f missing $w"; done; done; echo "script-block check done"
```

Expected: only `script-block check done` (no "missing" lines). If any chapter is missing scripts, add the canonical block from `_SCRIPT_BLOCK.html`.

- [ ] **Step 3: Re-run all widget tests.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && node _tests/cloth-core.test.js && node _tests/graph-coloring.test.js
```

Expected: `cloth-core: ALL PASS` and `graph-coloring: ALL PASS`.

- [ ] **Step 4: Verify all widgets mount headlessly together.** Run:

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD/learn && node -e "
require('./_tests/dom-stub.js'); const {makeEl}=require('./_tests/dom-stub.js');
window.VBWidgets={}; require('./assets/js/widgets/registry.js');
['vbd-core','cloth-core','graph-coloring'].forEach(m=>require('./assets/js/widgets/'+m+'.js'));
['warp-launch','graph-coloring','parallel-sweep','cloth-lab','avbd-penalty-ramp','strand-lab','vbd-sweep','mass-ratio'].forEach(w=>{
  require('./assets/js/widgets/'+w+'.js'); window.VBWidgets[w](makeEl('div')); console.log(w,'OK');
});"
```

Expected: one `… OK` line per widget, no throw.

- [ ] **Step 5: Real-browser pass (if available).** Check for a browser automation tool: `which chromium chromium-browser google-chrome 2>/dev/null; node -e "try{require.resolve('playwright');console.log('playwright available')}catch(e){console.log('no playwright')}"`. If available, open `learn/index.html`, navigate to 7-1, 8-5, 9-1, 10-1, confirm widgets render and no console errors. If NOT available, note in the final report that verification was static + node-stub only (carrying forward the original book's known limitation).

- [ ] **Step 6: Commit any fixes.**

```bash
cd /cpfs/shared/simulation/zhuzihou/dev/TinyVBD && git add -A learn && git commit -m "Integration fixes for Newton tutorial" || echo "nothing to fix"
```

---

### Task 15: Update project memory

**Files:**
- Modify: `<memory-dir>/tinyvbd-tutorial.md` (the existing tutorial memory)
- Modify: `<memory-dir>/MEMORY.md`

Memory dir: `/root/.local/share/claude-profile/sssai/.claude/projects/-cpfs-shared-simulation-zhuzihou-dev-TinyVBD/memory/`

- [ ] **Step 1: Append a "Newton 篇" note** to `tinyvbd-tutorial.md` recording: Parts 7–10 + appendix a-4/a-5/a-6 added; the new teal TinyVBD bridge; 5 new widgets (warp-launch, graph-coloring, parallel-sweep, cloth-lab+cloth-core, avbd-penalty-ramp) with headless tests in `learn/_tests/`; `_NEWTON_BRIEF.md` as the FACTS doc; particle-VBD focus with AVBD overview; and whether a real-browser pass was done. Convert any relative dates to absolute (2026-06).

- [ ] **Step 2: Verify MEMORY.md pointer** still accurately describes the tutorial (update the one-line hook if needed to mention the Newton extension).

- [ ] **Step 3: No commit needed** (memory dir is outside the repo). Confirm with: `ls -la <memory-dir>/tinyvbd-tutorial.md`.

---

## Self-Review (completed)

- **Spec coverage:** Every spec section maps to a task — bridge (T1), content.js/nav (T2), 4 new widgets + cloth-lab/core (T3–T7), FACTS doc (T8), Parts 7–10 (T9–T12), appendix (T13), build/verification incl. real-browser caveat (T14), memory (T15). Chapter counts match spec (14 + 3 = 17 sections; flat count 46).
- **Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N". Widget code and tests are given in full. Chapter tasks specify exact files, `data-section`, assigned widget, and the subagent method (content prose is authored from the FACTS doc, not pre-written here — appropriate, since it's long-form bilingual writing, but each step pins down structure, widget, and verification).
- **Type/name consistency:** `Cloth` members used by `cloth-core.test.js` (`n`, `px/py`, `edges`, `colors`, `colorOf`, `forwardStep`, `solveSweep`, `energy`, `step`) all defined in T4 and consumed by `cloth-lab.js` in T5. `greedyColor`/`buildMeshGraphs` defined and tested in T6, reused conceptually in T4's `colorGraph`. Widget names match across content.js (T2), `_SCRIPT_BLOCK.html` (T2), chapter embeds (T9–T13), and verification (T14). CSS token `--tv` (not colliding with existing `--interactive`).
- **One fix applied during review:** clarified that appendix sections go *inside* the existing `pa` part while p7–p10 insert *before* it (T2 Step 1–2), preventing a nav-ordering bug.
