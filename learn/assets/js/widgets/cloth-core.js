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
