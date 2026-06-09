/* spring-hessian — 一根弹簧的能量 E、力 f 和 Hessian H 的几何。
   E = ½k(l - l0)²,  f = k(l0-l)/l · d,  H = k[ I - (l0/l)(I - dd^T/l²) ].
   H 沿弹簧方向特征值恒为 k；垂直方向特征值 k(1 - l0/l) 在压缩(l<l0)时变负 → 不定。
   拖动端点感受这一切。 */
(function () {
  window.VBWidgets["spring-hessian"] = function (root) {
    const W = 460, H = 340;
    const c = (n) => VBW.c(n);
    const k = 1, l0 = 0.34;
    const anchor = { x: 0.3, y: 0.55 };
    let p = { x: 0.66, y: 0.55 };

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;background:var(--surface-2);border-radius:10px;cursor:grab";
    const X = (u) => u * W, Y = (v) => v * H;

    const panel = VBW.el("div", { style: "font-family:var(--mono);font-size:.78rem;color:var(--ink-soft);margin-top:8px;line-height:1.8" });

    function draw() {
      ctx.clearRect(0, 0, W, H);
      let dx = p.x - anchor.x, dy = p.y - anchor.y;
      const l = Math.hypot(dx, dy) || 1e-6;
      const stretch = l - l0;
      // rest 环
      ctx.strokeStyle = c("border-strong"); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(X(anchor.x), Y(anchor.y), l0 * W, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      // 弹簧
      ctx.strokeStyle = stretch > 0 ? "#e0463c" : "#3a7de0"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X(anchor.x), Y(anchor.y)); ctx.lineTo(X(p.x), Y(p.y)); ctx.stroke();
      // anchor
      ctx.fillStyle = c("ink"); ctx.beginPath(); ctx.arc(X(anchor.x), Y(anchor.y), 6, 0, 7); ctx.fill();
      // Hessian 椭圆（特征值：沿向 k，垂直 k(1-l0/l)）
      const lpar = k, lperp = k * (1 - l0 / l);
      const ang = Math.atan2(dy, dx);
      const scale = 70;
      ctx.save();
      ctx.translate(X(p.x), Y(p.y)); ctx.rotate(ang);
      ctx.beginPath();
      const a = Math.abs(lpar) * scale, b = Math.abs(lperp) * scale;
      ctx.ellipse(0, 0, Math.max(a, 4), Math.max(b, 2), 0, 0, 7);
      ctx.strokeStyle = lperp < 0 ? "#e0463c" : c("interactive"); ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      // 力箭头 f = k(l0-l)/l d
      const s = k * (l0 - l) / l;
      const fx = s * dx, fy = s * dy;
      ctx.strokeStyle = c("warn"); ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(X(p.x), Y(p.y)); ctx.lineTo(X(p.x + fx), Y(p.y + fy)); ctx.stroke();
      // 端点
      ctx.fillStyle = c("accent"); ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 6, 0, 7); ctx.fill();
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px monospace";
      ctx.fillText("虚线 = rest length 环   椭圆 = Hessian 主轴   橙箭头 = 弹力 f", 10, H - 12);

      const E = 0.5 * k * stretch * stretch;
      panel.innerHTML =
        `l = ${l.toFixed(3)} &nbsp; l0 = ${l0} &nbsp; ${stretch > 0 ? "<span style='color:#e0463c'>拉伸</span>" : "<span style='color:#3a7de0'>压缩</span>"}<br>` +
        `E = ½k(l-l0)² = <b style="color:var(--interactive)">${E.toFixed(4)}</b> &nbsp; |f| = ${Math.hypot(fx, fy).toFixed(3)}<br>` +
        `Hessian 特征值： 沿弹簧 λ∥ = k = ${lpar.toFixed(2)} &nbsp; 垂直 λ⊥ = k(1−l0/l) = <b style="color:${lperp < 0 ? '#e0463c' : 'var(--interactive)'}">${lperp.toFixed(3)}</b>` +
        (lperp < 0 ? " &nbsp;⟵ <span style='color:#e0463c'>负！H 不定（压缩屈曲方向）</span>" : "");
    }

    function setP(e) {
      const r = cv.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e;
      p = { x: VBW.clamp((t.clientX - r.left) / r.width, 0.02, 0.98), y: VBW.clamp((t.clientY - r.top) / r.height, 0.02, 0.98) };
      draw();
    }
    let down = false;
    cv.addEventListener("mousedown", (e) => { down = true; cv.style.cursor = "grabbing"; setP(e); });
    window.addEventListener("mousemove", (e) => { if (down) setP(e); });
    window.addEventListener("mouseup", () => { down = false; cv.style.cursor = "grab"; });

    root.appendChild(cv); root.appendChild(panel);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
