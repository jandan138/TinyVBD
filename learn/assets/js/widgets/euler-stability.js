/* euler-stability — 同一个弹簧振子 x'' = -ω²x，三种时间积分对比：
   forward (explicit) Euler 会爆炸；implicit (backward) Euler 永远稳定（带数值阻尼）；
   semi-implicit (symplectic) 在 dt·ω<2 时稳定。拖大 dt 看谁先崩。 */
(function () {
  window.VBWidgets["euler-stability"] = function (root) {
    const W = 560, H = 280, PAD = 34;
    const c = (n) => VBW.c(n);
    let dt = 0.08, omega2 = 100, steps = 220;

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;background:var(--surface-2);border-radius:10px";

    function integrate(kind) {
      let x = 1, v = 0; const arr = [x];
      for (let i = 0; i < steps; i++) {
        if (kind === "explicit") { const xn = x + dt * v, vn = v - dt * omega2 * x; x = xn; v = vn; }
        else if (kind === "implicit") { const d = 1 + dt * dt * omega2; const xn = (x + dt * v) / d; const vn = (v - dt * omega2 * x) / d; x = xn; v = vn; }
        else { v = v - dt * omega2 * x; x = x + dt * v; } // symplectic
        arr.push(x);
        if (!isFinite(x) || Math.abs(x) > 1e6) { while (arr.length <= steps) arr.push(NaN); break; }
      }
      return arr;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const X = (i) => PAD + i / steps * (W - 2 * PAD);
      const Y = (x) => H / 2 - x * (H / 2 - PAD) / 2.2;
      // 轴
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, H / 2); ctx.lineTo(W - PAD, H / 2); ctx.stroke();
      const series = [
        { k: "explicit", col: "#e0463c", name: "forward (explicit) Euler" },
        { k: "symplectic", col: c("interactive"), name: "semi-implicit (symplectic)" },
        { k: "implicit", col: c("accent"), name: "backward (implicit) Euler" },
      ];
      series.forEach((s) => {
        const arr = integrate(s.k);
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < arr.length; i++) {
          const yy = VBW.clamp(Y(arr[i]), -50, H + 50);
          if (!isFinite(arr[i])) break;
          if (!started) { ctx.moveTo(X(i), yy); started = true; } else ctx.lineTo(X(i), yy);
        }
        ctx.strokeStyle = s.col; ctx.lineWidth = 1.8; ctx.stroke();
      });
      // 图例
      ctx.font = "11px monospace";
      series.forEach((s, i) => {
        ctx.fillStyle = s.col; ctx.fillRect(PAD, 12 + i * 15, 16, 3);
        ctx.fillStyle = c("ink-soft"); ctx.fillText(s.name, PAD + 22, 16 + i * 15);
      });
      const dw = dt * Math.sqrt(omega2);
      ctx.fillStyle = c("ink-soft");
      ctx.fillText("dt·ω = " + dw.toFixed(2) + (dw >= 2 ? "  → explicit & symplectic 失稳" : ""), W - 250, H - 12);
    }

    const ctrls = VBW.row();
    const s1 = VBW.slider("时间步 dt", 0.01, 0.25, 0.005, dt, (v) => { dt = v; draw(); }, (v) => v.toFixed(3));
    const s2 = VBW.slider("刚度 ω² = k/m", 20, 400, 10, omega2, (v) => { omega2 = v; draw(); });
    ctrls.appendChild(s1.wrap); ctrls.appendChild(s2.wrap);
    root.appendChild(cv); root.appendChild(ctrls);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
