/* distance-gradient — point-segment（point-triangle 在 2D 的类比）的无符号距离与梯度 ∂d/∂x。
   拖动点 p，画最近点 q、距离 d、梯度箭头：∂d/∂p = n̂（点上）、-λ·n̂（两端，长度按 barycentric 权重）。
   当最近点滑到端点 → 退化成 point-point，高亮提示。用于 11-3 讲几何梯度、11-7 worked example。 */
(function () {
  window.VBWidgets["distance-gradient"] = function (root) {
    const W = 560, H = 320;
    const c = (n) => VBW.c(n);
    // 线段端点 a,b（画布坐标）
    const a = { x: 130, y: 230 }, b = { x: 430, y: 230 };
    // 可拖动的点 p（默认在线段内部正上方）
    const p = { x: 280, y: 110 };
    let dragging = false;

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px;cursor:grab;touch-action:none";

    // 最近点：把 p 投影到线段 ab，clamp 到 [0,1]
    function closest() {
      const abx = b.x - a.x, aby = b.y - a.y;
      const apx = p.x - a.x, apy = p.y - a.y;
      const L2 = abx * abx + aby * aby;
      let t = L2 > 0 ? (apx * abx + apy * aby) / L2 : 0;
      const tc = VBW.clamp(t, 0, 1);
      const q = { x: a.x + tc * abx, y: a.y + tc * aby };
      const dx = p.x - q.x, dy = p.y - q.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      const n = { x: dx / d, y: dy / d };          // 单位法向 n̂ = (p - q)/d
      // barycentric 权重（线段：λ_a = 1-tc, λ_b = tc）
      const endpoint = (tc <= 0.001 || tc >= 0.999);
      return { q, d, n, la: 1 - tc, lb: tc, endpoint };
    }

    function arrow(x0, y0, x1, y1, col, wd) {
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = wd;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const ang = Math.atan2(y1 - y0, x1 - x0), s = 7;
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - s * Math.cos(ang - 0.4), y1 - s * Math.sin(ang - 0.4));
      ctx.lineTo(x1 - s * Math.cos(ang + 0.4), y1 - s * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const r = closest();
      const AL = 46;  // 梯度箭头视觉长度比例

      // 线段
      ctx.strokeStyle = c("ink-soft"); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      // 端点
      function dot(P, col, rad) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(P.x, P.y, rad, 0, 7); ctx.fill(); }
      dot(a, c("ink-soft"), 5); dot(b, c("ink-soft"), 5);
      ctx.fillStyle = c("ink-faint"); ctx.font = "13px var(--mono)";
      ctx.fillText("a", a.x - 16, a.y + 5); ctx.fillText("b", b.x + 8, b.y + 5);

      // d 连线（p—q）
      ctx.strokeStyle = c("border"); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(r.q.x, r.q.y); ctx.stroke();
      ctx.setLineDash([]);
      dot(r.q, r.endpoint ? "#e0463c" : c("interactive"), 5);

      // 梯度箭头：点 p 上 +n̂；两端各 -λ n̂（长度按权重）
      arrow(p.x, p.y, p.x + r.n.x * AL, p.y + r.n.y * AL, c("interactive"), 2.5);
      if (!r.endpoint) {
        arrow(a.x, a.y, a.x - r.n.x * AL * r.la, a.y - r.n.y * AL * r.la, c("pbd") || "#c98a2b", 2);
        arrow(b.x, b.y, b.x - r.n.x * AL * r.lb, b.y - r.n.y * AL * r.lb, c("pbd") || "#c98a2b", 2);
      }
      // 点 p
      dot(p, c("accent") || "#6b5bd6", 7);
      ctx.fillStyle = c("ink"); ctx.fillText("p (拖我)", p.x + 12, p.y - 8);

      // 读数面板
      ctx.font = "12px var(--mono)"; ctx.fillStyle = c("ink-soft");
      const dWorld = (r.d / 100).toFixed(3);  // 像素→“世界单位”仅作展示
      ctx.fillText("d = " + dWorld, 18, 26);
      ctx.fillText("n̂ = (" + r.n.x.toFixed(2) + ", " + (-r.n.y).toFixed(2) + ")", 18, 44);
      ctx.fillText("λ_a = " + r.la.toFixed(2) + "   λ_b = " + r.lb.toFixed(2), 18, 62);
      // 图例
      ctx.fillStyle = c("interactive"); ctx.fillText("→ ∂d/∂p = n̂", W - 200, 26);
      ctx.fillStyle = c("pbd") || "#c98a2b"; ctx.fillText("→ ∂d/∂a,b = -λ n̂", W - 200, 44);
      if (r.endpoint) {
        ctx.fillStyle = "#e0463c"; ctx.font = "13px var(--mono)";
        ctx.fillText("⚠ 最近点落在端点 → 退化成 point-point", 18, H - 16);
      } else {
        ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
        ctx.fillText("最近点在线段内部：梯度按 barycentric 权重分给两端", 18, H - 16);
      }
    }

    // 拖拽
    function pos(e) {
      const rct = cv.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: (t.clientX - rct.left), y: (t.clientY - rct.top) };
    }
    function down(e) { const m = pos(e); if (Math.hypot(m.x - p.x, m.y - p.y) < 24) { dragging = true; cv.style.cursor = "grabbing"; e.preventDefault(); } }
    function move(e) { if (!dragging) return; const m = pos(e); p.x = VBW.clamp(m.x, 12, W - 12); p.y = VBW.clamp(m.y, 12, H - 12); draw(); e.preventDefault(); }
    function up() { dragging = false; cv.style.cursor = "grab"; }
    cv.addEventListener("mousedown", down); window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    cv.addEventListener("touchstart", down, { passive: false }); cv.addEventListener("touchmove", move, { passive: false }); cv.addEventListener("touchend", up);

    root.appendChild(cv);
    const cap = VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "拖动点 p：青色箭头是它受的梯度方向 ∂d/∂p = n̂（指向远离线段）；琥珀箭头是分给两端的 -λn̂，长度正比于 barycentric 权重。把 p 拖到某一端正上方，最近点滑到端点——退化成 point-point。");
    root.appendChild(cap);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
