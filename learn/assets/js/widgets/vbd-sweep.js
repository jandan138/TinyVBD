/* vbd-sweep — 把 Gauss-Seidel 顶点块下降「拆成慢动作」。
   一次只更新一个顶点：组装它的 2×2 系统 (f_i, H_i)，解 Δx_i = H_i⁻¹f_i，
   看增量势能 G 单调下降。展示「局部下降 = 全局下降」。 */
(function () {
  window.VBWidgets["vbd-sweep"] = function (root) {
    const W = 560, H = 300, dt = 1 / 60;
    const c = (n) => VBW.c(n);
    let strand, cur, iter, lastR;

    function init() {
      strand = new VBW.Strand({ numVerts: 7, dis: 0.08, stiffness: 4e4, m0: 1, mTip: 1, tanAngle: 0.0, gravity: -10 });
      // 给一个偏移，让初始就有可见形变
      strand.forwardStep(dt);
      cur = 1; iter = 0; lastR = strand.residual(dt);
    }
    init();

    const wx0 = -0.1, wx1 = 0.62, wy0 = -0.32, wy1 = 0.78;
    const sc = Math.min(W / (wx1 - wx0), H / (wy1 - wy0));
    const ox = (W - sc * (wx1 - wx0)) / 2, oy = (H - sc * (wy1 - wy0)) / 2;
    const X = (x) => ox + (x - wx0) * sc;
    const Y = (y) => H - oy - (y - wy0) * sc;

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;background:var(--surface-2);border-radius:10px";

    const panel = VBW.el("div", { style: "font-family:var(--mono);font-size:.78rem;color:var(--ink-soft);margin-top:8px;line-height:1.7" });

    function fmt(x) { return (x >= 0 ? " " : "") + x.toFixed(3); }

    function draw(info) {
      ctx.clearRect(0, 0, W, H);
      const n = strand.n;
      // 惯性目标 y（虚线圈）
      for (let i = 1; i < n; i++) {
        ctx.beginPath(); ctx.arc(X(strand.yx[i]), Y(strand.yy[i]), 3, 0, 7);
        ctx.fillStyle = c("ink-faint") + "88"; ctx.fill();
      }
      // 弹簧
      strand.edges.forEach((e) => {
        if (e.b - e.a !== 1) return;
        ctx.beginPath(); ctx.moveTo(X(strand.px[e.a]), Y(strand.py[e.a]));
        ctx.lineTo(X(strand.px[e.b]), Y(strand.py[e.b]));
        ctx.strokeStyle = c("border-strong"); ctx.lineWidth = 2; ctx.stroke();
      });
      // 顶点
      for (let i = 0; i < n; i++) {
        ctx.beginPath(); ctx.arc(X(strand.px[i]), Y(strand.py[i]), i === cur ? 8 : (i === 0 ? 6 : 4.5), 0, 7);
        ctx.fillStyle = i === 0 ? c("ink") : (i === cur ? c("accent") : c("interactive"));
        ctx.fill();
        if (i === cur) { ctx.strokeStyle = c("accent"); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(strand.px[i]), Y(strand.py[i]), 13, 0, 7); ctx.stroke(); }
      }
      // 当前顶点的力箭头 f_i
      if (info) {
        const fx = info.f[0], fy = info.f[1];
        const norm = Math.hypot(fx, fy) || 1;
        const len = VBW.clamp(norm * 0.00002, 0.02, 0.18);
        const ux = fx / norm * len, uy = fy / norm * len;
        const x0 = strand.px[cur], y0 = strand.py[cur];
        ctx.strokeStyle = c("warn"); ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x0 + ux), Y(y0 + uy)); ctx.stroke();
        // 箭头
        const ang = Math.atan2(-(uy), ux);
        ctx.beginPath(); ctx.moveTo(X(x0 + ux), Y(y0 + uy));
        ctx.lineTo(X(x0 + ux) - 8 * Math.cos(ang - 0.4), Y(y0 + uy) + 8 * Math.sin(ang - 0.4));
        ctx.lineTo(X(x0 + ux) - 8 * Math.cos(ang + 0.4), Y(y0 + uy) + 8 * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fillStyle = c("warn"); ctx.fill();
      }
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px monospace";
      ctx.fillText("○ = 惯性目标 y_i    ● = 当前正在更新的顶点", 12, 18);
    }

    function updatePanel(info) {
      const G = strand.potential(dt), R = strand.residual(dt);
      let s = `<b style="color:var(--accent)">正在更新顶点 i = ${cur}</b> &nbsp; (sweep 第 ${iter + 1} 轮)<br>`;
      if (info) {
        s += `f_i = [${fmt(info.f[0])}, ${fmt(info.f[1])}]ᵀ &nbsp;(负梯度=力)<br>`;
        s += `H_i = [[${fmt(info.H[0])}, ${fmt(info.H[1])}], [${fmt(info.H[2])}, ${fmt(info.H[3])}]]<br>`;
        s += `Δx_i = H_i⁻¹ f_i = [${fmt(info.dx[0])}, ${fmt(info.dx[1])}]ᵀ<br>`;
      }
      s += `<span style="color:var(--interactive)">增量势能 G = ${G.toExponential(3)}</span> &nbsp; · &nbsp; 残差 ‖∇G‖ = ${R.toExponential(2)}`;
      panel.innerHTML = s;
    }

    // 预览当前顶点（不更新），再 step
    function preview() { return strand.assembleVertex(cur, dt); }
    function stepVertex() {
      const info = strand.assembleVertex(cur, dt);
      strand.px[cur] += info.dx[0]; strand.py[cur] += info.dx[1];
      cur++;
      if (cur >= strand.n) { cur = 1; iter++; }
      const nextInfo = preview();
      draw(nextInfo); updatePanel(nextInfo);
    }
    function fullSweep() { for (let k = 0; k < strand.n - 1; k++) stepVertex(); }
    function tenIters() { for (let k = 0; k < 10 * (strand.n - 1); k++) stepVertex(); }

    const ctrls = VBW.el("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin-top:10px" });
    const b1 = VBW.el("button", { class: "btn primary" }, "▶ 更新下一个顶点");
    const b2 = VBW.el("button", { class: "btn" }, "⤳ 完成一整轮 sweep");
    const b3 = VBW.el("button", { class: "btn" }, "⏩ 跑 10 轮");
    const b4 = VBW.el("button", { class: "btn" }, "↻ 重置");
    b1.addEventListener("click", stepVertex);
    b2.addEventListener("click", fullSweep);
    b3.addEventListener("click", tenIters);
    b4.addEventListener("click", () => { init(); const info = preview(); draw(info); updatePanel(info); });
    [b1, b2, b3, b4].forEach((b) => ctrls.appendChild(b));

    root.appendChild(cv); root.appendChild(panel); root.appendChild(ctrls);
    window.addEventListener("themechange", () => draw(preview()));
    const info0 = preview(); draw(info0); updatePanel(info0);
  };
})();
