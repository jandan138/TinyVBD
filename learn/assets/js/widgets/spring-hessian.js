/* spring-hessian — 一根弹簧的能量 E、力 f 和 Hessian H 的几何。
   E = ½k(l - l0)²,  f = k(l0-l)/l · d,  H = k[ I - (l0/l)(I - dd^T/l²) ].
   H 沿弹簧方向特征值恒为 k；横向特征值 k(1 - l0/l) 在受压(l<l0)时变负。
   l = 0 且 l0 > 0 时方向、gradient/force 与 Hessian 没有经典定义。 */
(function () {
  window.VBWidgets["spring-hessian"] = function (root) {
    const W = 460, H = 340;
    const S = Math.min(W, H) * 0.88;
    const DIRECTION_EPS = 1e-3;
    const c = (n) => VBW.c(n);
    const k = 1, l0 = 0.34;
    const anchor = { x: 0.3, y: 0.55 };
    let p = { x: 0.66, y: 0.55 };

    const cv = VBW.el("canvas", { "aria-label": "弹簧能量、力与 Hessian 交互图" });
    const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px;cursor:grab;touch-action:none";
    const X = (u) => W / 2 + (u - 0.5) * S;
    const Y = (v) => H / 2 + (v - 0.5) * S;

    const panel = VBW.el("div", { style: "font-family:var(--mono);font-size:.78rem;color:var(--ink-soft);margin-top:8px;line-height:1.8" });

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const dx = p.x - anchor.x, dy = p.y - anchor.y;
      const l = Math.hypot(dx, dy);
      const stretch = l - l0;
      const directionDefined = l > DIRECTION_EPS;
      // rest 环
      ctx.strokeStyle = c("border-strong"); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(X(anchor.x), Y(anchor.y), l0 * S, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      // 弹簧
      ctx.strokeStyle = stretch > 0 ? "#e0463c" : "#3a7de0"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X(anchor.x), Y(anchor.y)); ctx.lineTo(X(p.x), Y(p.y)); ctx.stroke();
      // anchor
      ctx.fillStyle = c("ink"); ctx.beginPath(); ctx.arc(X(anchor.x), Y(anchor.y), 6, 0, Math.PI * 2); ctx.fill();

      let lpar, lperp, fx, fy;
      if (directionDefined) {
        // 椭圆只编码两个主方向的绝对幅值；颜色另行编码横向曲率符号。
        lpar = k;
        lperp = k * (1 - l0 / l);
        const ang = Math.atan2(dy, dx);
        const amplitudeScale = 52;
        const a = Math.min(Math.abs(lpar) * amplitudeScale, 96);
        const b = Math.min(Math.abs(lperp) * amplitudeScale, 96);
        ctx.save();
        ctx.translate(X(p.x), Y(p.y)); ctx.rotate(ang);
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(a, 4), Math.max(b, 2), 0, 0, Math.PI * 2);
        ctx.strokeStyle = lperp < 0 ? "#e0463c" : c("interactive"); ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();

        // f = k(l0-l) d/l；方向未定义时不构造这个箭头。
        const forceMagnitude = k * (l0 - l);
        fx = forceMagnitude * dx / l;
        fy = forceMagnitude * dy / l;
        ctx.strokeStyle = c("warn"); ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(X(p.x), Y(p.y)); ctx.lineTo(X(p.x + fx), Y(p.y + fy)); ctx.stroke();
      } else {
        ctx.fillStyle = "#e0463c"; ctx.font = "11px monospace";
        ctx.fillText("方向 / force / H 未定义", X(p.x) + 10, Y(p.y) - 10);
      }
      // 端点
      ctx.fillStyle = c("accent"); ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px monospace";
      ctx.fillText("虚线=rest length  椭圆=主方向幅值示意(非等值线)  橙线=弹力", 10, H - 12);

      const E = 0.5 * k * stretch * stretch;
      const regime = Math.abs(stretch) < 1e-4
        ? "<span style='color:var(--interactive)'>rest</span>"
        : stretch > 0
          ? "<span style='color:#e0463c'>拉伸</span>"
          : "<span style='color:#3a7de0'>受压</span>";
      if (!directionDefined) {
        panel.innerHTML =
          `l = ${l.toFixed(4)} &nbsp; l0 = ${l0} &nbsp; ${regime}<br>` +
          `E = ½k(l-l0)² = <b style="color:var(--interactive)">${E.toFixed(4)}</b><br>` +
          `<b style="color:#e0463c">零长度邻域停止显示方向、gradient/force 与 Hessian；精确 l=0 时它们未定义。</b>`;
        return;
      }

      panel.innerHTML =
        `l = ${l.toFixed(3)} &nbsp; l0 = ${l0} &nbsp; ${regime}<br>` +
        `E = ½k(l-l0)² = <b style="color:var(--interactive)">${E.toFixed(4)}</b> &nbsp; |f| = ${Math.hypot(fx, fy).toFixed(3)}<br>` +
        `Hessian 特征值： 沿弹簧 λ∥ = k = ${lpar.toFixed(2)} &nbsp; 横向 λ⊥ = k(1−l0/l) = <b style="color:${lperp < 0 ? '#e0463c' : 'var(--interactive)'}">${lperp.toFixed(3)}</b>` +
        (lperp < 0 ? " &nbsp;⟵ <span style='color:#e0463c'>受压构型的横向负曲率（仅是屈曲分析的局部原料）</span>" : "");
    }

    function setP(e) {
      const r = cv.getBoundingClientRect();
      const sx = (e.clientX - r.left) * W / r.width;
      const sy = (e.clientY - r.top) * H / r.height;
      p = {
        x: VBW.clamp(0.5 + (sx - W / 2) / S, 0.02, 0.98),
        y: VBW.clamp(0.5 + (sy - H / 2) / S, 0.02, 0.98),
      };
      draw();
    }
    let activePointer = null;
    cv.addEventListener("pointerdown", (e) => {
      if (activePointer !== null) return;
      activePointer = e.pointerId;
      cv.setPointerCapture(e.pointerId);
      cv.style.cursor = "grabbing";
      setP(e);
    });
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerId === activePointer) setP(e);
    });
    function releasePointer(e) {
      if (e.pointerId !== activePointer) return;
      activePointer = null;
      cv.style.cursor = "grab";
      if (cv.hasPointerCapture && cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId);
    }
    cv.addEventListener("pointerup", releasePointer);
    cv.addEventListener("pointercancel", releasePointer);
    cv.addEventListener("lostpointercapture", (e) => {
      if (e.pointerId === activePointer) {
        activePointer = null;
        cv.style.cursor = "grab";
      }
    });

    root.appendChild(cv); root.appendChild(panel);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
