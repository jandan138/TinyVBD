/* line-search — 牛顿步为什么要"试探着走"：一维能量曲线 + 牛顿方向。
   full step (α=1) 可能冲过头、落到能量更高处；backtracking line search 从 α=1 起不断减半，
   直到找到让能量真正下降的步长。拖能量曲率/起点，看 full step 何时翻车、line search 怎么救。 */
(function () {
  window.VBWidgets["line-search"] = function (root) {
    const W = 560, H = 300, PAD = 40; const c = (n) => VBW.c(n);
    // 能量 E(x)：一个非二次的碗，带点不对称 → 牛顿步(按局部二次模型)可能过头
    const st = { x0: -0.7, curv: 1.0, asym: 0.7 };   // 起点、曲率、不对称强度（默认落在 full step 会翻车的区）
    function E(x) { return 0.5 * st.curv * x * x + st.asym * Math.cos(1.6 * x) + 0.4 * x; }
    function dE(x) { const h = 1e-4; return (E(x + h) - E(x - h)) / (2 * h); }
    function d2E(x) { const h = 1e-3; return (E(x + h) - 2 * E(x) + E(x - h)) / (h * h); }

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const xmin = -3, xmax = 3;
      // 采样能量曲线找范围
      let emin = 1e9, emax = -1e9;
      for (let i = 0; i <= 200; i++) { const x = xmin + (xmax - xmin) * i / 200; const e = E(x); if (e < emin) emin = e; if (e > emax) emax = e; }
      const PX = (x) => PAD + (x - xmin) / (xmax - xmin) * (W - 2 * PAD);
      const PY = (e) => (H - PAD) - (e - emin) / (emax - emin + 1e-9) * (H - 2 * PAD);
      // 能量曲线
      ctx.strokeStyle = c("ink-soft"); ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = xmin + (xmax - xmin) * i / 200; const X = PX(x), Y = PY(E(x)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke();
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)"; ctx.fillText("能量 E(x)", PAD, PAD - 8); ctx.fillText("x →", W - PAD - 24, H - PAD + 18);

      // 牛顿方向：Δx = -E'/E''（局部二次模型的极小）
      const g = dE(st.x0), hh = d2E(st.x0);
      const indefinite = hh <= 0;              // E''≤0 → 局部不定，牛顿方向指向上坡
      const denom = Math.abs(hh) < 1e-6 ? (indefinite ? -1e-6 : 1e-6) : hh;
      const dir = -g / denom;
      const xFull = st.x0 + dir;              // α=1 full step 落点
      // backtracking line search：α=1 起减半，直到 E 下降
      let alpha = 1, tries = 0; const E0 = E(st.x0);
      while (E(st.x0 + alpha * dir) > E0 && alpha > 1e-3 && tries < 14) { alpha *= 0.5; tries++; }
      const xLS = st.x0 + alpha * dir;
      const lsOK = E(xLS) < E0;

      function dot(x, col, r, lab) {
        const X = PX(x), Y = PY(E(x)); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X, Y, r, 0, 7); ctx.fill();
        if (lab) { ctx.fillStyle = col; ctx.font = "11px var(--mono)"; ctx.fillText(lab, X + 6, Y - 6); }
      }
      // 起点
      dot(st.x0, c("ink"), 5, "起点 xₖ");

      if (indefinite) {
        // E''≤0：牛顿方向本身朝上坡，line search 救不了——这是 PSD 投影的活
        ctx.fillStyle = "#e0463c"; ctx.font = "12px var(--mono)";
        ctx.fillText("⚠ 这里 E'' ≤ 0（曲率是「马鞍」侧）", PAD, 24);
        ctx.fillStyle = c("ink-soft"); ctx.font = "11px var(--mono)";
        ctx.fillText("牛顿方向本身指向上坡 → line search 怎么缩步长都救不回。", PAD, H - 28);
        ctx.fillText("这不是步长问题，是方向问题——得先 PSD 投影把 H 掰正（见 1.5 / 3.6）。", PAD, H - 12);
        // 在起点画一段朝上坡的方向箭头
        ctx.strokeStyle = "#e0463c"; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(PX(st.x0), PY(E(st.x0)) + 14); ctx.lineTo(PX(xFull), PY(E(st.x0)) + 14); ctx.stroke(); ctx.setLineDash([]);
        return;
      }

      // 牛顿方向箭头(水平)
      ctx.strokeStyle = c("ink-faint"); ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(PX(st.x0), PY(E(st.x0)) + 14); ctx.lineTo(PX(xFull), PY(E(st.x0)) + 14); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = c("ink-faint"); ctx.fillText("牛顿方向", (PX(st.x0) + PX(xFull)) / 2 - 24, PY(E(st.x0)) + 28);
      // full step 落点
      const fullUp = E(xFull) > E0;
      dot(xFull, fullUp ? "#e0463c" : c("warn"), 6, "α=1 (full)" + (fullUp ? " ↑能量反升!" : ""));
      // line search 落点
      dot(xLS, c("interactive"), 6, "α=" + alpha.toFixed(alpha < 0.1 ? 3 : 2) + " (line search)");

      // 状态条
      ctx.font = "12px var(--mono)";
      if (fullUp) { ctx.fillStyle = "#e0463c"; ctx.fillText("⚠ full step 冲过头，能量反而升高 → 牛顿一步会发散", PAD, 24); }
      else { ctx.fillStyle = c("interactive"); ctx.fillText("✓ 这步 full step 恰好下降；但曲率不对时就会翻车", PAD, 24); }
      ctx.fillStyle = c("interactive"); ctx.font = "11px var(--mono)";
      ctx.fillText("line search 回退到 α=" + alpha.toFixed(3) + "，保证 E(xₖ₊₁) < E(xₖ)" + (lsOK ? " ✓" : ""), PAD, H - 14);
    }

    const r1 = VBW.row();
    r1.appendChild(VBW.slider("起点 xₖ", -2.6, 2.6, 0.1, st.x0, (v) => { st.x0 = v; draw(); }, (v) => v.toFixed(1)).wrap);
    r1.appendChild(VBW.slider("能量不对称(易翻车)", 0, 1.2, 0.05, st.asym, (v) => { st.asym = v; draw(); }, (v) => v.toFixed(2)).wrap);
    root.appendChild(cv); root.appendChild(r1);
    root.appendChild(VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "牛顿步只给方向（按局部二次模型指向碗底），不保证「一步走满（α=1）」是对的。把「能量不对称」调大、或挪动起点：full step（红/琥珀）常常冲过头、落到能量更高处——牛顿一步就发散了。line search 从 α=1 起不断减半（backtracking），直到找到让能量真正下降的 α（青），这一步才安全。这就是为什么牛顿法要「试探着走」。"));
    window.addEventListener("themechange", draw); draw();
  };
})();
