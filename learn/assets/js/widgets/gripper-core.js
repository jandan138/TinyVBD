/* gripper-core.js — 教学用 1D 双指夹块（非后端数值等价）。
   不变量（headless 测试锁定）：
   - coupled + μ>0 + forceLimit → 能抬起
   - sequential + 同参 → 抬不起
   - coupled + μ=0 → 抬不起 */
(function () {
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function GripperCore(opts) {
    opts = opts || {};
    this.dt = opts.dt != null ? opts.dt : 1 / 60;
    this.halfW = opts.halfW != null ? opts.halfW : 0.12;
    this.k = opts.k != null ? opts.k : 90;
    this.d = opts.d != null ? opts.d : 10;
    this.fMax = opts.fMax != null ? opts.fMax : 1.0;
    this.mu = opts.mu != null ? opts.mu : 0.85;
    this.weight = opts.weight != null ? opts.weight : 1.0;
    this.mode = opts.mode || "sequential";
    this.mimicOn = opts.mimicOn != null ? opts.mimicOn : true;
    this.forceLimitOn = opts.forceLimitOn != null ? opts.forceLimitOn : true;
    this.iters = opts.iters != null ? opts.iters : 6;
    this.targetClose = opts.targetClose != null ? opts.targetClose : 0.12;
    this.reset();
  }

  GripperCore.prototype.reset = function () {
    this.qL = -0.30;
    this.qR = 0.30;
    this.vL = 0;
    this.vR = 0;
    this.xO = 0;
    this.yO = 0;
    this.tableY = 0;
    this.lifted = false;
    this.stableBilateral = false;
    this.last = { fL: 0, fR: 0, nL: 0, nR: 0, fric: 0, hold: false, gap: 0.6 };
  };

  GripperCore.prototype._clip = function (f) {
    return this.forceLimitOn ? clamp(f, -this.fMax, this.fMax) : f;
  };

  GripperCore.prototype._drive = function (q, v, qStar) {
    return this._clip(this.k * (qStar - q) - this.d * v);
  };

  GripperCore.prototype._hardMimic = function () {
    if (!this.mimicOn) return;
    this.qR = -this.qL;
    this.vR = -this.vL;
  };

  GripperCore.prototype._stepSequential = function () {
    var dt = this.dt;
    var fL = 0, fR = 0, nL = 0, nR = 0;
    var qStarL = -this.targetClose;
    var qStarR = this.targetClose;
    var left = this.xO - this.halfW;
    var right = this.xO + this.halfW;

    for (var it = 0; it < this.iters; it++) {
      this._hardMimic();
      fL = this._drive(this.qL, this.vL, qStarL);
      fR = this.mimicOn ? 0 : this._drive(this.qR, this.vR, qStarR);
      this.vL += fL * dt;
      this.vR += fR * dt;
      this.qL += this.vL * dt;
      this.qR += this.vR * dt;

      nL = 0; nR = 0;
      if (this.qL > left) { nL = 50 * (this.qL - left); this.qL = left; this.vL = Math.min(this.vL, 0); }
      if (this.qR < right) { nR = 50 * (right - this.qR); this.qR = right; this.vR = Math.max(this.vR, 0); }

      // 末尾硬 mimic 覆盖接触摆位 → 破坏双侧同时贴合
      this._hardMimic();
    }

    left = this.xO - this.halfW;
    right = this.xO + this.halfW;
    var touchL = Math.abs(this.qL - left) < 0.008;
    var touchR = Math.abs(this.qR - right) < 0.008;
    this.stableBilateral = touchL && touchR;
    if (!this.stableBilateral) {
      // 单侧残余接触：等效夹紧力崩掉
      nL *= 0.05;
      nR *= 0.05;
    }
    this._vertical(nL, nR, fL, fR);
  };

  GripperCore.prototype._stepCoupled = function () {
    var dt = this.dt;
    var qStarL = -this.targetClose;
    var fL = this._drive(this.qL, this.vL, qStarL);
    var fR = this.mimicOn ? 0 : this._drive(this.qR, this.vR, this.targetClose);

    // 一次写回：对称 mimic + 双侧贴面 + 有界 drive 意图
    var left = this.xO - this.halfW;
    var right = this.xO + this.halfW;
    var qL = left;
    var qR = right;
    if (this.mimicOn) {
      qL = this.xO - this.halfW;
      qR = this.xO + this.halfW;
    }
    this.vL = (qL - this.qL) / dt;
    this.vR = (qR - this.qR) / dt;
    this.qL = qL;
    this.qR = qR;
    this.stableBilateral = true;

    // Maintain grasp preload while bilateral contact is held, even if PD error→0.
    var preload = 0.65 * this.fMax;
    var nL = Math.min(Math.max(Math.abs(fL), preload), this.forceLimitOn ? this.fMax : 1e9);
    var nR = this.mimicOn
      ? nL
      : Math.min(Math.max(Math.abs(fR), preload), this.forceLimitOn ? this.fMax : 1e9);
    this._vertical(nL, nR, fL, fR);
  };

  GripperCore.prototype._vertical = function (nL, nR, fL, fR) {
    var dt = this.dt;
    var N = Math.max(0, nL) + Math.max(0, nR);
    var fricMax = this.mu * N;
    var hold = this.stableBilateral && fricMax >= this.weight * 0.98;
    var fric = hold ? this.weight : Math.min(fricMax, this.weight);
    if (hold) {
      this.yO += 0.5 * dt; // steady lift while holding
      this.lifted = this.yO > 0.08;
    } else {
      this.yO -= 1.2 * dt;
      if (this.yO < this.tableY) this.yO = this.tableY;
      this.lifted = false;
    }
    this.last = { fL: fL, fR: fR, nL: nL, nR: nR, fric: fric, hold: hold, gap: this.qR - this.qL };
  };

  GripperCore.prototype.step = function () {
    if (this.mode === "coupled") this._stepCoupled();
    else this._stepSequential();
    return this.snapshot();
  };

  GripperCore.prototype.snapshot = function () {
    return {
      qL: this.qL, qR: this.qR, xO: this.xO, yO: this.yO,
      gap: this.qR - this.qL, lifted: this.lifted, hold: this.last.hold,
      stableBilateral: this.stableBilateral,
      nL: this.last.nL, nR: this.last.nR, fric: this.last.fric,
      fL: this.last.fL, fR: this.last.fR,
      mode: this.mode, mu: this.mu, fMax: this.fMax,
      mimicOn: this.mimicOn, forceLimitOn: this.forceLimitOn, weight: this.weight,
    };
  };

  GripperCore.run = function (cfg, frames) {
    var g = new GripperCore(cfg);
    for (var i = 0; i < (frames || 150); i++) g.step();
    return g.snapshot();
  };

  window.VBW = window.VBW || {};
  window.VBW.GripperCore = GripperCore;
})();
