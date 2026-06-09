/* =========================================================================
   vbd-core.js — 一个忠实的 2D Vertex Block Descent strand 求解器
   直接对应 TinyVBD 的 Strand.h / main.cpp 里的 solve()/forwardStep()，
   只是降到 2D 便于在 canvas 上画。供 strand-lab / vbd-sweep / mass-ratio 复用。

   incremental potential:  G(x) = Σ m_i/(2h²)|x_i - y_i|²  +  Σ_e ½k_e(|x_a-x_b| - l0_e)²
   per-vertex Newton step:  Δx_i = H_i⁻¹ f_i,   f_i = -∂G_i/∂x_i,  H_i = ∂²G_i/∂x_i²
   ========================================================================= */
(function () {
  // 2x2 线性求解 H x = f
  function solve2x2(H, f) {
    const det = H[0] * H[3] - H[1] * H[2];
    if (Math.abs(det) < 1e-12) return [0, 0]; // det 阈值跳过（对应论文 |det(H_i)|≤ε 则跳过该顶点）
    const inv = 1 / det;
    return [
      inv * (H[3] * f[0] - H[1] * f[1]),
      inv * (-H[2] * f[0] + H[0] * f[1]),
    ];
  }

  function Strand(opts) {
    opts = opts || {};
    this.n = opts.numVerts || 20;
    this.dis = opts.dis || 0.05;
    this.stiffness = opts.stiffness != null ? opts.stiffness : 1e5;
    this.m0 = opts.m0 != null ? opts.m0 : 1;
    this.mTip = opts.mTip != null ? opts.mTip : 1;       // 末端质量（高质量比实验）
    this.tanAngle = opts.tanAngle != null ? opts.tanAngle : 0.57735; // 30°
    this.skipSpring = !!opts.skipSpring;
    this.skipStiffness = opts.skipStiffness != null ? opts.skipStiffness : 100;
    this.gravity = opts.gravity != null ? opts.gravity : -10;
    this.altStiffness = opts.altStiffness || null;        // [k1,k2] 交替刚度（高刚度比实验）
    this.useChebyshev = !!opts.useChebyshev;
    this.rho = opts.rho != null ? opts.rho : 0.95;
    this.build();
  }

  Strand.prototype.build = function () {
    const n = this.n, dis = this.dis;
    this.px = new Float64Array(n); this.py = new Float64Array(n);
    this.px0 = new Float64Array(n); this.py0 = new Float64Array(n);   // rest / 初始
    this.ppx = new Float64Array(n); this.ppy = new Float64Array(n);   // prev pos
    this.vx = new Float64Array(n); this.vy = new Float64Array(n);
    this.vpx = new Float64Array(n); this.vpy = new Float64Array(n);   // prev velocity
    this.yx = new Float64Array(n); this.yy = new Float64Array(n);     // inertia y
    this.pp2x = new Float64Array(n); this.pp2y = new Float64Array(n); // x^(n-2) for chebyshev
    this.mass = new Float64Array(n);
    const initH = 0.85;
    for (let i = 0; i < n; i++) {
      this.px[i] = i * dis;
      this.py[i] = initH + i * dis * this.tanAngle;
      this.mass[i] = (i === n - 1) ? this.mTip : this.m0;
    }
    // edges
    this.edges = [];
    this.adj = Array.from({ length: n }, () => []);
    for (let i = 0; i < n - 1; i++) {
      let k = this.stiffness;
      if (this.altStiffness) k = (i % 2) ? this.altStiffness[1] : this.altStiffness[0];
      const l0 = Math.hypot(this.px[i + 1] - this.px[i], this.py[i + 1] - this.py[i]);
      const id = this.edges.length;
      this.edges.push({ a: i, b: i + 1, l0: l0, k: k });
      this.adj[i].push(id); this.adj[i + 1].push(id);
      if (this.skipSpring && i < n - 2) {
        const l0s = Math.hypot(this.px[i + 2] - this.px[i], this.py[i + 2] - this.py[i]);
        const id2 = this.edges.length;
        this.edges.push({ a: i, b: i + 2, l0: l0s, k: this.skipStiffness });
        this.adj[i].push(id2); this.adj[i + 2].push(id2);
      }
    }
    this.px0.set(this.px); this.py0.set(this.py);
    this.hasVelPrev = false;
    this.frame = 0;
  };

  Strand.prototype.reset = function () {
    this.px.set(this.px0); this.py.set(this.py0);
    this.vx.fill(0); this.vy.fill(0); this.vpx.fill(0); this.vpy.fill(0);
    this.hasVelPrev = false; this.frame = 0;
  };

  // forwardStep: 半隐式速度积分 + 惯性预测 + 初始猜测
  Strand.prototype.forwardStep = function (dt) {
    const n = this.n;
    for (let i = 0; i < n; i++) { this.vy[i] += dt * this.gravity; }
    this.vx[0] = 0; this.vy[0] = 0;                 // pin 第 0 个顶点
    for (let i = 0; i < n; i++) {
      this.yx[i] = this.px[i] + this.vx[i] * dt;
      this.yy[i] = this.py[i] + this.vy[i] * dt;
      this.ppx[i] = this.px[i]; this.ppy[i] = this.py[i]; // prev pos
    }
    // 初始猜测 = 惯性位置（对应代码里 strand.mVertPos = strand.inertia）
    for (let i = 0; i < n; i++) { this.px[i] = this.yx[i]; this.py[i] = this.yy[i]; }
  };

  // 组装单个顶点的 2x2 系统并返回（不修改位置）—— 供 vbd-sweep 展示
  Strand.prototype.assembleVertex = function (iV, dt) {
    const inv = 1 / (dt * dt);
    const m = this.mass[iV];
    // 惯性项
    let f = [m * inv * (this.yx[iV] - this.px[iV]), m * inv * (this.yy[iV] - this.py[iV])];
    let H = [m * inv, 0, 0, m * inv];
    for (const eid of this.adj[iV]) {
      const e = this.edges[eid];
      const a = e.a, b = e.b;
      let dx = this.px[a] - this.px[b], dy = this.py[a] - this.py[b];
      const l = Math.hypot(dx, dy) || 1e-9;
      const k = e.k, l0 = e.l0;
      // Hessian: k (I - (l0/l)(I - dd^T/l²))
      const c = l0 / l;
      const xx = dx * dx / (l * l), yy = dy * dy / (l * l), xy = dx * dy / (l * l);
      H[0] += k * (1 - c * (1 - xx));
      H[1] += k * (c * xy);
      H[2] += k * (c * xy);
      H[3] += k * (1 - c * (1 - yy));
      // force: ± k (l0-l)/l diff
      const s = k * (l0 - l) / l;
      if (a === iV) { f[0] += s * dx; f[1] += s * dy; }
      else { f[0] -= s * dx; f[1] -= s * dy; }
    }
    const d = solve2x2(H, f);
    return { f: f, H: H, dx: d };
  };

  // 对单个顶点做一次更新
  Strand.prototype.solveVertex = function (iV, dt) {
    if (iV === 0) return null;            // pinned
    const r = this.assembleVertex(iV, dt);
    this.px[iV] += r.dx[0]; this.py[iV] += r.dx[1];
    return r;
  };

  // 一次完整 Gauss-Seidel sweep（顶点 1..n-1）
  Strand.prototype.sweep = function (dt) {
    for (let i = 1; i < this.n; i++) this.solveVertex(i, dt);
  };

  // Chebyshev 加速：x^(n) = ω(x̄ - x^(n-2)) + x^(n-2)
  Strand.prototype.omega = function (iter) {
    const rho = this.rho;
    if (iter <= 1) return 1;
    if (iter === 2) return 2 / (2 - rho * rho);
    return 4 / (4 - rho * rho * this._prevOmega);
  };

  // 跑 numIter 次迭代（含可选 Chebyshev）
  Strand.prototype.solve = function (dt, numIter) {
    this._prevOmega = 1;
    for (let it = 0; it < numIter; it++) {
      // 备份 x^(n-1) -> 用于设置 prevprev
      const bx = this.px.slice(), by = this.py.slice();
      this.sweep(dt);
      if (this.useChebyshev) {
        const w = this.omega(it + 1);
        this._prevOmega = w;
        if (w > 1) {
          for (let i = 1; i < this.n; i++) {
            this.px[i] = w * (this.px[i] - this.pp2x[i]) + this.pp2x[i];
            this.py[i] = w * (this.py[i] - this.pp2y[i]) + this.pp2y[i];
          }
        }
        this.pp2x.set(bx); this.pp2y.set(by);
      }
    }
  };

  Strand.prototype.updateVelocity = function (dt) {
    for (let i = 0; i < this.n; i++) {
      this.vpx[i] = this.vx[i]; this.vpy[i] = this.vy[i];
      this.vx[i] = (this.px[i] - this.ppx[i]) / dt;
      this.vy[i] = (this.py[i] - this.ppy[i]) / dt;
    }
    this.vx[0] = 0; this.vy[0] = 0;
    this.hasVelPrev = true;
  };

  // 一整步
  Strand.prototype.step = function (dt, numIter) {
    this.forwardStep(dt);
    this.solve(dt, numIter);
    this.updateVelocity(dt);
    this.frame++;
  };

  // 增量势能 G（用于收敛曲线 / 能量监控）
  Strand.prototype.potential = function (dt) {
    const inv = 1 / (dt * dt);
    let G = 0;
    for (let i = 0; i < this.n; i++) {
      const dx = this.px[i] - this.yx[i], dy = this.py[i] - this.yy[i];
      G += 0.5 * this.mass[i] * inv * (dx * dx + dy * dy);
    }
    for (const e of this.edges) {
      const dx = this.px[e.a] - this.px[e.b], dy = this.py[e.a] - this.py[e.b];
      const l = Math.hypot(dx, dy);
      G += 0.5 * e.k * (l - e.l0) * (l - e.l0);
    }
    return G;
  };

  // 总梯度范数（收敛残差）
  Strand.prototype.residual = function (dt) {
    let s = 0;
    for (let i = 1; i < this.n; i++) {
      const r = this.assembleVertex(i, dt);
      s += r.f[0] * r.f[0] + r.f[1] * r.f[1];
    }
    return Math.sqrt(s);
  };

  window.VBW.Strand = Strand;
  window.VBW.solve2x2 = solve2x2;
})();
