/* chebyshev — Gauss-Seidel 顶点块下降的收敛曲线，加 vs 不加 Chebyshev 加速。
   残差 ‖∇G‖（log 轴）随迭代下降。调 ρ：合适的 ρ 明显加速；ρ 太大开始振荡甚至发散。 */
(function () {
  window.VBWidgets["chebyshev"] = function (root) {
    const W = 560, H = 300, PAD = 40, dt = 1 / 60;
    const c = (n) => VBW.c(n);
    let rho = 0.9, niter = 60;

    function makeStrand() {
      const s = new VBW.Strand({ numVerts: 12, dis: 0.06, stiffness: 2e5, m0: 1, mTip: 50, tanAngle: 0.3, gravity: -10 });
      s.forwardStep(dt);
      return s;
    }
    function run(useCheby, rhoV) {
      const s = makeStrand(); s.rho = rhoV;
      const res = [s.residual(dt)];
      let prevOmega = 1;
      const pp2x = new Float64Array(s.n), pp2y = new Float64Array(s.n);
      for (let it = 0; it < niter; it++) {
        const bx = s.px.slice(), by = s.py.slice();
        s.sweep(dt);
        if (useCheby) {
          let w;
          if (it === 0) w = 1; else if (it === 1) w = 2 / (2 - rhoV * rhoV); else w = 4 / (4 - rhoV * rhoV * prevOmega);
          prevOmega = w;
          if (w > 1) for (let i = 1; i < s.n; i++) { s.px[i] = w * (s.px[i] - pp2x[i]) + pp2x[i]; s.py[i] = w * (s.py[i] - pp2y[i]) + pp2y[i]; }
          pp2x.set(bx); pp2y.set(by);
        }
        let r = s.residual(dt);
        if (!isFinite(r) || r > 1e12) r = NaN;
        res.push(r);
      }
      return res;
    }

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const plain = run(false, 0), cheb = run(true, rho);
      const all = plain.concat(cheb).filter((x) => isFinite(x) && x > 0);
      const hi = Math.log10(Math.max.apply(null, all)), lo = Math.log10(Math.min.apply(null, all));
      const PX = (i) => PAD + i / niter * (W - 2 * PAD);
      const PY = (r) => { const v = (Math.log10(r) - lo) / (hi - lo + 1e-9); return (H - PAD) - VBW.clamp(v, 0, 1) * (H - 2 * PAD); };
      // 轴
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke();
      ctx.fillStyle = c("ink-faint"); ctx.font = "10px monospace";
      ctx.fillText("残差 ‖∇G‖ (log)", PAD - 6, PAD - 10); ctx.fillText("迭代 →", W - PAD - 40, H - PAD + 18);
      function plot(arr, col, wdt) {
        ctx.beginPath(); let started = false;
        for (let i = 0; i < arr.length; i++) {
          if (!isFinite(arr[i]) || arr[i] <= 0) { started = false; continue; }
          const x = PX(i), y = PY(arr[i]);
          started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true;
        }
        ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.stroke();
      }
      plot(plain, c("ink-faint"), 1.6);
      plot(cheb, c("accent"), 2.2);
      // 是否发散
      const last = cheb[cheb.length - 1];
      const diverged = !isFinite(last) || cheb.some((x) => !isFinite(x));
      // 图例
      ctx.fillStyle = c("ink-faint"); ctx.fillRect(W - 230, PAD, 14, 3); ctx.fillStyle = c("ink-soft"); ctx.fillText("纯 Gauss-Seidel", W - 210, PAD + 4);
      ctx.fillStyle = c("accent"); ctx.fillRect(W - 230, PAD + 16, 14, 3); ctx.fillStyle = c("ink-soft"); ctx.fillText("+ Chebyshev (ρ=" + rho.toFixed(2) + ")", W - 210, PAD + 20);
      if (diverged) { ctx.fillStyle = "#e0463c"; ctx.fillText("⚠ ρ 过大 → 振荡/发散", W - 230, PAD + 36); }
    }

    const ctrls = VBW.row();
    const sR = VBW.slider("ρ (spectral radius 估计)", 0, 0.99, 0.01, rho, (v) => { rho = v; draw(); }, (v) => v.toFixed(2));
    const sN = VBW.slider("迭代上限", 20, 120, 5, niter, (v) => { niter = v; draw(); });
    ctrls.appendChild(sR.wrap); ctrls.appendChild(sN.wrap);
    const cap = VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "试试把 ρ 从 0 慢慢调到 0.95：曲线越压越陡（收敛越快）。再往 0.99 推，加速曲线开始上下振荡——这就是论文里说的 overshoot。");
    root.appendChild(cv); root.appendChild(ctrls); root.appendChild(cap);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
