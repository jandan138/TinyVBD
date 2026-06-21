/* element-assembly — 一个三角形单元：给定形变(拖顶点)→算 P=∂ψ/∂F→按 ∂F/∂x 把力分配到 3 个节点。
   节点力箭头长度/方向实时变；三力之和为 0（单元不产生净外力，呼应 12-7 弹簧 ±号 / barycentric 落点）。 */
(function () {
  window.VBWidgets["element-assembly"] = function (root) {
    const W = 560, H = 300; const c = (n) => VBW.c(n);
    const Xr = [[0, 0], [1, 0], [0, 1]];                  // rest（数学坐标，单位直角）
    const P = [{ x: 280, y: 210 }, { x: 410, y: 210 }, { x: 285, y: 90 }]; // world（画布），可拖
    const st = { mu: 1.0, lam: 0.5 }; let drag = -1;
    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px;cursor:grab;touch-action:none";

    const SC = 110; // 像素/单位
    function world() { return P.map((p) => [(p.x - P[0].x) / SC, -(p.y - P[0].y) / SC]); }
    function mat2(a, b) { return [a[0], b[0], a[1], b[1]]; }
    function inv2(m) { const d = m[0] * m[3] - m[1] * m[2]; return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d]; }
    function mul2(A, B) { return [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]]; }
    function transpose(m) { return [m[0], m[2], m[1], m[3]]; }
    function compute() {
      const w = world();
      const Dm = mat2([Xr[1][0] - Xr[0][0], Xr[1][1] - Xr[0][1]], [Xr[2][0] - Xr[0][0], Xr[2][1] - Xr[0][1]]);
      const Ds = mat2([w[1][0] - w[0][0], w[1][1] - w[0][1]], [w[2][0] - w[0][0], w[2][1] - w[0][1]]);
      const DmInv = inv2(Dm); const F = mul2(Ds, DmInv);
      // Neo-Hookean-ish P = μ(F - F^{-T}) + λ ln J F^{-T}
      const J = F[0] * F[3] - F[1] * F[2];
      const FinvT = transpose(inv2(F));
      const lnJ = Math.log(Math.max(1e-3, Math.abs(J)));
      const Pst = [st.mu * (F[0] - FinvT[0]) + st.lam * lnJ * FinvT[0],
                   st.mu * (F[1] - FinvT[1]) + st.lam * lnJ * FinvT[1],
                   st.mu * (F[2] - FinvT[2]) + st.lam * lnJ * FinvT[2],
                   st.mu * (F[3] - FinvT[3]) + st.lam * lnJ * FinvT[3]];
      // H = V0 * P * Dm^{-T}  → 列是作用于节点1,2的力；节点0取负和
      const V0 = 0.5 * Math.abs(Dm[0] * Dm[3] - Dm[1] * Dm[2]);
      const DmInvT = transpose(DmInv);
      const Hm = mul2(Pst, DmInvT);
      const f1 = [-V0 * Hm[0], -V0 * Hm[2]], f2 = [-V0 * Hm[1], -V0 * Hm[3]];
      const f0 = [-(f1[0] + f2[0]), -(f1[1] + f2[1])];
      return { J, forces: [f0, f1, f2] };
    }
    function arrow(x0, y0, dx, dy, col) {
      const L = Math.hypot(dx, dy); if (L < 1e-4) return;
      const s = Math.min(70, 40 * L) / L; const x1 = x0 + dx * s, y1 = y0 - dy * s;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const a = Math.atan2(y1 - y0, x1 - x0);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 7 * Math.cos(a - 0.4), y1 - 7 * Math.sin(a - 0.4)); ctx.lineTo(x1 - 7 * Math.cos(a + 0.4), y1 - 7 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const r = compute();
      ctx.strokeStyle = r.J < 0 ? "#e0463c" : c("interactive"); ctx.fillStyle = (r.J < 0 ? "#e0463c" : c("interactive")) + "22"; ctx.lineWidth = 2;
      ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill(); ctx.stroke();
      P.forEach((p, i) => { ctx.fillStyle = c("accent") || "#6b5bd6"; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 7); ctx.fill(); ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)"; ctx.fillText("x" + i, p.x + 8, p.y - 8); });
      r.forces.forEach((f, i) => arrow(P[i].x, P[i].y, f[0], f[1], c("warn")));
      ctx.fillStyle = c("ink-soft"); ctx.font = "12px var(--mono)";
      ctx.fillText("拖顶点形变 → P=∂ψ/∂F → 节点力 f = -V₀ P Dm⁻ᵀ", 20, 28);
      ctx.fillText("J = " + r.J.toFixed(2) + "   Σf ≈ 0（单元无净外力）", 20, H - 18);
    }
    function pos(e) { const b = cv.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: t.clientX - b.left, y: t.clientY - b.top }; }
    cv.addEventListener("mousedown", (e) => { const m = pos(e); drag = P.findIndex((p) => Math.hypot(p.x - m.x, p.y - m.y) < 16); if (drag >= 0) { cv.style.cursor = "grabbing"; e.preventDefault(); } });
    window.addEventListener("mousemove", (e) => { if (drag < 0) return; const m = pos(e); P[drag].x = VBW.clamp(m.x, 20, W - 20); P[drag].y = VBW.clamp(m.y, 40, H - 30); draw(); });
    window.addEventListener("mouseup", () => { drag = -1; cv.style.cursor = "grab"; });
    cv.addEventListener("touchstart", (e) => { const m = pos(e); drag = P.findIndex((p) => Math.hypot(p.x - m.x, p.y - m.y) < 20); if (drag >= 0) e.preventDefault(); }, { passive: false });
    cv.addEventListener("touchmove", (e) => { if (drag < 0) return; const m = pos(e); P[drag].x = VBW.clamp(m.x, 20, W - 20); P[drag].y = VBW.clamp(m.y, 40, H - 30); draw(); e.preventDefault(); }, { passive: false });
    cv.addEventListener("touchend", () => { drag = -1; });
    const r1 = VBW.row();
    r1.appendChild(VBW.slider("μ", 0.2, 3, 0.1, st.mu, (v) => { st.mu = v; draw(); }, (v) => v.toFixed(1)).wrap);
    r1.appendChild(VBW.slider("λ", 0, 3, 0.1, st.lam, (v) => { st.lam = v; draw(); }, (v) => v.toFixed(1)).wrap);
    root.appendChild(cv); root.appendChild(r1);
    root.appendChild(VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "拖任一节点让单元形变：应力 P 经 ∂F/∂x 把力（琥珀箭头）分配到三个节点。三力之和恒为 0——和 12-7 弹簧 ±号、barycentric 落点同一回事，只是从『两端』升级成『单元三节点』。这些力累加进每顶点的 fᵢ，和弹簧走同一个装配口。"));
    window.addEventListener("themechange", draw); draw();
  };
})();
