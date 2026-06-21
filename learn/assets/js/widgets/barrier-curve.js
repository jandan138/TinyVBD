/* barrier-curve — IPC 的 log-barrier 接触能量 b(d, d̂) 及其力/Hessian 随距离 d 的曲线。
   d < d̂ 才激活、d→0 发散（任意大接触力，永不穿透）；可叠加 penalty 曲线对照（penalty 在 d=0 仍有限）。
   切「能量 / 力 / Hessian」视图，调 d̂ 与 barrier 刚度 κ。性质演示用，非论文精确等式。 */
(function () {
  window.VBWidgets["barrier-curve"] = function (root) {
    const W = 560, H = 300, PAD = 44;
    const c = (n) => VBW.c(n);
    const state = { dhat: 0.4, kappa: 1.0, view: "energy", penalty: true };

    // 性质化的 barrier：b(d) = -κ (d - d̂)^2 ln(d / d̂)，仅在 0<d<d̂ 激活；d≥d̂ 时为 0。
    // （形式取自常见 IPC 写法，这里只为展示「d→0 发散、d̂ 处平滑接 0」的性质。）
    function barrier(d) {
      const dh = state.dhat, k = state.kappa;
      if (d >= dh || d <= 0) return 0;
      const t = d / dh;
      return -k * (d - dh) * (d - dh) * Math.log(t);
    }
    // 力 = -db/dd（数值微分，足够画曲线）
    function force(d) {
      const h = 1e-4;
      return -(barrier(d + h) - barrier(d - h)) / (2 * h);
    }
    function hess(d) {
      const h = 1e-3;
      return (barrier(d + h) - 2 * barrier(d) + barrier(d - h)) / (h * h);
    }
    // 对照：penalty = ½ κ_p (d̂ - d)^2，d<d̂，d=0 处仍有限（不发散）
    function penalty(d) {
      const dh = state.dhat;
      if (d >= dh) return 0;
      return 0.5 * state.kappa * (dh - d) * (dh - d);
    }
    function penaltyForce(d) {
      const dh = state.dhat;
      if (d >= dh) return 0;
      return state.kappa * (dh - d);
    }

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function sample(fn) {
      const N = 240, xs = [], ys = [];
      // d 从接近 0 取到 1.0（d̂ 落在中间）
      for (let i = 1; i <= N; i++) {
        const d = (i / N) * 1.0;
        let y = fn(d);
        if (!isFinite(y)) y = NaN;
        xs.push(d); ys.push(y);
      }
      return { xs, ys };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const isE = state.view === "energy", isF = state.view === "force";
      const bf = isE ? barrier : isF ? force : hess;
      const pf = isE ? penalty : isF ? penaltyForce : null;
      const bar = sample(bf);
      const pen = (state.penalty && pf) ? sample(pf) : null;

      // y 范围：barrier 会冲很高，裁到一个可视上限
      let yMax = 0;
      bar.ys.forEach((v) => { if (isFinite(v)) yMax = Math.max(yMax, v); });
      if (pen) pen.ys.forEach((v) => { if (isFinite(v)) yMax = Math.max(yMax, v); });
      const cap = yMax > 0 ? yMax * 0.55 : 1;       // 裁顶，让发散趋势可见而不顶破画布
      const yLo = (isF || state.view === "hessian") ? 0 : 0;

      const PX = (d) => PAD + d * (W - 2 * PAD);
      const PY = (y) => (H - PAD) - VBW.clamp((y - yLo) / (cap - yLo + 1e-9), 0, 1) * (H - 2 * PAD);

      // 轴
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, PAD - 6); ctx.lineTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke();
      // d̂ 竖虚线
      ctx.strokeStyle = c("warn"); ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(PX(state.dhat), PAD - 6); ctx.lineTo(PX(state.dhat), H - PAD); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = c("warn"); ctx.font = "11px var(--mono)";
      ctx.fillText("d̂ (激活阈值)", PX(state.dhat) + 6, PAD + 6);

      function plot(s, col, wd) {
        ctx.beginPath(); let started = false;
        for (let i = 0; i < s.xs.length; i++) {
          if (!isFinite(s.ys[i])) { started = false; continue; }
          const x = PX(s.xs[i]), y = PY(s.ys[i]);
          started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true;
        }
        ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.stroke();
      }
      if (pen) plot(pen, c("pbd") || "#c98a2b", 1.8);
      plot(bar, c("interactive"), 2.4);

      // 标签
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
      const ylab = isE ? "能量 b(d)" : isF ? "接触力 -b'(d)" : "Hessian b''(d)";
      ctx.fillText(ylab, 6, PAD + 4);
      ctx.fillText("距离 d →", W - PAD - 56, H - PAD + 18);
      ctx.fillText("0", PAD - 8, H - PAD + 16);

      // 图例
      let ly = PAD + 4;
      ctx.fillStyle = c("interactive"); ctx.fillRect(W - 196, ly, 14, 3);
      ctx.fillStyle = c("ink-soft"); ctx.fillText("IPC log-barrier", W - 176, ly + 4);
      if (pen) {
        ly += 16; ctx.fillStyle = c("pbd") || "#c98a2b"; ctx.fillRect(W - 196, ly, 14, 3);
        ctx.fillStyle = c("ink-soft"); ctx.fillText("penalty (对照)", W - 176, ly + 4);
      }
      if (isE) {
        ly += 16; ctx.fillStyle = c("ink-faint");
        ctx.fillText("d→0 时 barrier →∞，penalty 有限", W - 250, ly + 4);
      }
    }

    // 控件
    const r1 = VBW.row();
    r1.appendChild(VBW.seg([
      { label: "能量", value: "energy" }, { label: "力", value: "force" }, { label: "Hessian", value: "hessian" }
    ], state.view, (v) => { state.view = v; draw(); }));
    const r2 = VBW.row();
    r2.appendChild(VBW.slider("d̂ (激活阈值)", 0.15, 0.7, 0.05, state.dhat, (v) => { state.dhat = v; draw(); }, (v) => v.toFixed(2)).wrap);
    r2.appendChild(VBW.slider("κ (barrier 刚度)", 0.2, 3, 0.1, state.kappa, (v) => { state.kappa = v; draw(); }, (v) => v.toFixed(1)).wrap);
    r2.appendChild(VBW.toggle("叠加 penalty 对照", state.penalty, (v) => { state.penalty = v; draw(); }));

    root.appendChild(cv); root.appendChild(r1); root.appendChild(r2);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
