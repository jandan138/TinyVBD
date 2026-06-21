/* deformation-gradient-tri — 形变梯度 F = Ds·Dm⁻¹（2D 三角形单元）。
   左 rest 三角形（固定），右 world 三角形（拖顶点）。实时算 F(2×2)、J=detF（面积比，<0=翻转）、
   极分解 F=RS 的旋转角与两个主拉伸 σ₁,σ₂。constant-strain：单元内 F 处处相同。 */
(function () {
  window.VBWidgets["deformation-gradient-tri"] = function (root) {
    const W = 560, H = 300; const c = (n) => VBW.c(n);
    // rest 三角形（直角等腰，画布左侧）
    const Xr = [{ x: 70, y: 200 }, { x: 170, y: 200 }, { x: 70, y: 100 }];
    // world 三角形（右侧，可拖）—— 初值 = rest 平移 + 轻微拉伸
    const Xw = [{ x: 360, y: 200 }, { x: 470, y: 205 }, { x: 365, y: 95 }];
    let drag = -1;
    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px;cursor:grab;touch-action:none";

    // 以画布 y 向下，转成数学 y 向上的边向量
    function edges(P) { return [[P[1].x - P[0].x, -(P[1].y - P[0].y)], [P[2].x - P[0].x, -(P[2].y - P[0].y)]]; }
    function mat2(a, b) { return [a[0], b[0], a[1], b[1]]; } // 列向量 a,b → [m00,m01,m10,m11]
    function inv2(m) { const d = m[0] * m[3] - m[1] * m[2]; return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d]; }
    function mul2(A, B) { return [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]]; }
    function F() { const Dm = mat2(...edges(Xr)), Ds = mat2(...edges(Xw)); return mul2(Ds, inv2(Dm)); }
    // 极分解：F = R S，R 旋转角 θ，S 对称正定 → 用 SVD 风格取奇异值作主拉伸
    function decomp(f) {
      const J = f[0] * f[3] - f[1] * f[2];
      // 旋转角：F 的列均值方向，简化用 atan2(F[2],F[0])
      const theta = Math.atan2(f[2], f[0]);
      // 奇异值（2×2）：σ² 是 FᵀF 的特征值
      const a = f[0] * f[0] + f[2] * f[2], b = f[0] * f[1] + f[2] * f[3], d = f[1] * f[1] + f[3] * f[3];
      const tr = a + d, det = a * d - b * b;
      const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
      const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
      return { J, theta: theta * 180 / Math.PI, s1: Math.sqrt(Math.max(0, l1)), s2: Math.sqrt(Math.max(0, l2)) };
    }

    function drawTri(P, col, label) {
      ctx.strokeStyle = col; ctx.fillStyle = col + "22"; ctx.lineWidth = 2;
      ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill(); ctx.stroke();
      P.forEach((p, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, i === 0 ? 4 : 6, 0, 7); ctx.fill(); });
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)"; ctx.fillText(label, P[0].x - 10, P[0].y + 24);
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const f = F(), r = decomp(f);
      drawTri(Xr, c("ink-soft"), "rest X");
      drawTri(Xw, r.J < 0 ? "#e0463c" : c("interactive"), "world x (拖)");
      // F 矩阵 + 读数
      ctx.fillStyle = c("ink"); ctx.font = "12px var(--mono)";
      ctx.fillText("F = [ " + f[0].toFixed(2) + "  " + f[1].toFixed(2) + " ]", 250, 250);
      ctx.fillText("      [ " + f[2].toFixed(2) + "  " + f[3].toFixed(2) + " ]", 250, 266);
      ctx.fillStyle = r.J < 0 ? "#e0463c" : c("ink-soft");
      ctx.fillText("J = detF = " + r.J.toFixed(2) + (r.J < 0 ? "  ⚠ 单元翻转!" : (r.J < 1 ? "  (压缩)" : "  (膨胀)")), 30, 250);
      ctx.fillStyle = c("ink-soft");
      ctx.fillText("极分解 F=RS:  旋转 θ≈" + r.theta.toFixed(0) + "°   主拉伸 σ₁=" + r.s1.toFixed(2) + " σ₂=" + r.s2.toFixed(2), 30, 286);
      ctx.fillStyle = c("ink-faint"); ctx.font = "10px var(--mono)";
      ctx.fillText("constant-strain：整个单元一个 F", 360, 250);
    }
    function pos(e) { const r = cv.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; }
    cv.addEventListener("mousedown", (e) => { const m = pos(e); drag = Xw.findIndex((p) => Math.hypot(p.x - m.x, p.y - m.y) < 16); if (drag >= 0) { cv.style.cursor = "grabbing"; e.preventDefault(); } });
    window.addEventListener("mousemove", (e) => { if (drag < 0) return; const m = pos(e); Xw[drag].x = VBW.clamp(m.x, 210, W - 10); Xw[drag].y = VBW.clamp(m.y, 10, H - 40); draw(); });
    window.addEventListener("mouseup", () => { drag = -1; cv.style.cursor = "grab"; });
    cv.addEventListener("touchstart", (e) => { const m = pos(e); drag = Xw.findIndex((p) => Math.hypot(p.x - m.x, p.y - m.y) < 20); if (drag >= 0) e.preventDefault(); }, { passive: false });
    cv.addEventListener("touchmove", (e) => { if (drag < 0) return; const m = pos(e); Xw[drag].x = VBW.clamp(m.x, 210, W - 10); Xw[drag].y = VBW.clamp(m.y, 10, H - 40); draw(); e.preventDefault(); }, { passive: false });
    cv.addEventListener("touchend", () => { drag = -1; });
    root.appendChild(cv);
    root.appendChild(VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "拖 world 三角形的顶点：F 把 rest 形状线性映到 world。看 J=detF（面积比，把单元压到翻面会变负、变红）、极分解 F=RS 分出的旋转 θ 与两个主拉伸 σ。刚体旋转时 σ₁=σ₂=1、能量应为 0——这是 9-3 选能量模型的关键。"));
    window.addEventListener("themechange", draw); draw();
  };
})();
