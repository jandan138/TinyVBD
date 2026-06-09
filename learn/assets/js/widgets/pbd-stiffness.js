/* pbd-stiffness — 一条在重力下悬挂的约束链，PBD vs XPBD。
   PBD 的「有效刚度」随迭代次数漂移（迭代越多越硬）；XPBD 用 compliance α 把刚度
   钉死成物理量，与迭代次数无关。左：实时链；右：稳态伸长率 vs 迭代次数曲线。 */
(function () {
  window.VBWidgets["pbd-stiffness"] = function (root) {
    const W = 560, H = 320;
    const c = (n) => VBW.c(n);
    const n = 7, L = 0.12, m = 1, g = 9.8, dt = 1 / 60;
    let solver = "pbd", numIter = 6, kPBD = 0.3, alpha = 0.002;

    function settle(solv, iters, param) {
      const y = new Float64Array(n), v = new Float64Array(n);
      for (let i = 0; i < n; i++) y[i] = i * L;
      for (let step = 0; step < 600; step++) {
        const yold = y.slice();
        for (let i = 1; i < n; i++) { v[i] += dt * g; y[i] += dt * v[i]; }
        const lam = new Float64Array(n);
        for (let it = 0; it < iters; it++) {
          for (let i = 1; i < n; i++) {
            const C = (y[i] - y[i - 1]) - L;
            const w0 = i - 1 === 0 ? 0 : 1 / m, w1 = 1 / m;
            if (solv === "pbd") {
              const s = (param) * C / (w0 + w1);
              y[i] -= w1 * s; y[i - 1] += w0 * s;
            } else {
              const at = param / (dt * dt);
              const dl = (-C - at * lam[i]) / (w0 + w1 + at);
              lam[i] += dl;
              y[i] += w1 * dl; y[i - 1] -= w0 * dl;
            }
          }
        }
        for (let i = 1; i < n; i++) v[i] = (y[i] - yold[i]) / dt;
      }
      return y;
    }

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const chainW = 150;
      // 左：当前配置的链
      const y = settle(solver, numIter, solver === "pbd" ? kPBD : alpha);
      const total = y[n - 1] - y[0], nat = (n - 1) * L;
      const stretch = (total / nat - 1) * 100;
      const cx = 60, top = 30, scale = 200;
      // 自然长度参考
      ctx.strokeStyle = c("border-strong"); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx + 28, top); ctx.lineTo(cx + 28, top + nat * scale); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = c("ink-faint"); ctx.font = "10px monospace"; ctx.fillText("自然长", cx + 32, top + nat * scale + 4);
      // 链
      for (let i = 0; i < n; i++) {
        const py = top + (y[i] - y[0]) * scale;
        if (i > 0) {
          const py0 = top + (y[i - 1] - y[0]) * scale;
          ctx.strokeStyle = c("interactive"); ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(cx, py0); ctx.lineTo(cx, py); ctx.stroke();
        }
        ctx.fillStyle = i === 0 ? c("ink") : c("accent");
        ctx.beginPath(); ctx.arc(cx, py, i === n - 1 ? 6 : 4, 0, 7); ctx.fill();
      }
      ctx.fillStyle = c("ink"); ctx.font = "12px monospace";
      ctx.fillText(solver.toUpperCase() + "  iters=" + numIter, cx - 30, H - 26);
      ctx.fillStyle = c("warn"); ctx.fillText("伸长 " + stretch.toFixed(1) + "%", cx - 30, H - 10);

      // 右：稳态伸长率 vs 迭代次数曲线
      const px0 = 250, px1 = W - 24, py0 = 40, py1 = H - 40;
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px0, py1); ctx.lineTo(px1, py1); ctx.moveTo(px0, py0); ctx.lineTo(px0, py1); ctx.stroke();
      ctx.fillStyle = c("ink-faint"); ctx.font = "10px monospace";
      ctx.fillText("伸长%", px0 - 2, py0 - 6); ctx.fillText("迭代次数 →", px1 - 70, py1 + 16);
      const maxIt = 40, maxS = 40;
      const PX = (it) => px0 + it / maxIt * (px1 - px0);
      const PY = (s) => py1 - VBW.clamp(s / maxS, 0, 1) * (py1 - py0);
      function curve(solv, param, col) {
        ctx.beginPath();
        for (let it = 1; it <= maxIt; it++) {
          const yy = settle(solv, it, param);
          const s = ((yy[n - 1] - yy[0]) / nat - 1) * 100;
          it === 1 ? ctx.moveTo(PX(it), PY(s)) : ctx.lineTo(PX(it), PY(s));
        }
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      }
      curve("pbd", kPBD, "#e0463c");
      curve("xpbd", alpha, c("accent"));
      // 图例
      ctx.fillStyle = "#e0463c"; ctx.fillRect(px0 + 8, py0 + 2, 14, 3); ctx.fillStyle = c("ink-soft"); ctx.fillText("PBD（随迭代漂移→变硬）", px0 + 26, py0 + 6);
      ctx.fillStyle = c("accent"); ctx.fillRect(px0 + 8, py0 + 18, 14, 3); ctx.fillStyle = c("ink-soft"); ctx.fillText("XPBD（几乎水平→稳定）", px0 + 26, py0 + 22);
      // 当前 iter 竖线
      ctx.strokeStyle = c("interactive"); ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(PX(numIter), py0); ctx.lineTo(PX(numIter), py1); ctx.stroke(); ctx.setLineDash([]);
    }

    const ctrls = VBW.row();
    ctrls.appendChild((function () { const w = VBW.el("div", { class: "ctrl" }); w.appendChild(VBW.el("label", null, "<span>当前 solver</span>")); w.appendChild(VBW.seg([{ label: "PBD", value: "pbd" }, { label: "XPBD", value: "xpbd" }], "pbd", (v) => { solver = v; draw(); })); return w; })());
    const sIt = VBW.slider("迭代次数", 1, 40, 1, numIter, (v) => { numIter = v; draw(); });
    const sK = VBW.slider("PBD 刚度 k", 0.05, 1, 0.05, kPBD, (v) => { kPBD = v; draw(); }, (v) => v.toFixed(2));
    const sA = VBW.slider("XPBD compliance α", 0.0002, 0.01, 0.0002, alpha, (v) => { alpha = v; draw(); }, (v) => v.toFixed(4));
    ctrls.appendChild(sIt.wrap); ctrls.appendChild(sK.wrap); ctrls.appendChild(sA.wrap);
    root.appendChild(cv); root.appendChild(ctrls);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
