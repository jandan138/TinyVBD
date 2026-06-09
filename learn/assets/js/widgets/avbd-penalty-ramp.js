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
