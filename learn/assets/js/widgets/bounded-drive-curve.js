/* bounded-drive-curve — 理想 PD 力 vs 力限；求解外截断 vs 求解内未知量 */
(function () {
  window.VBWidgets["bounded-drive-curve"] = function (root) {
    const W = 560, H = 260;
    const state = { err: 0.8, k: 2.0, fMax: 1.0, inside: true };
    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const ideal = state.k * state.err;
      const clipped = Math.max(-state.fMax, Math.min(state.fMax, ideal));
      // axes
      ctx.strokeStyle = VBW.c("ink-soft"); ctx.beginPath();
      ctx.moveTo(50, 220); ctx.lineTo(520, 220); ctx.moveTo(50, 30); ctx.lineTo(50, 220); ctx.stroke();
      // ideal line
      ctx.strokeStyle = VBW.c("pbd") || "#c98a2b"; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(50, 220 - ideal * 80); ctx.lineTo(300, 220 - ideal * 80); ctx.stroke();
      ctx.setLineDash([]);
      // applied
      const applied = state.inside ? clipped : clipped; // same number, different story in caption
      ctx.fillStyle = VBW.c("interactive");
      ctx.fillRect(340, 220 - Math.abs(applied) * 80, 60, Math.abs(applied) * 80);
      ctx.fillStyle = VBW.c("ink"); ctx.font = "12px var(--mono)";
      ctx.fillText("理想 PD 力 " + ideal.toFixed(2), 60, 40);
      ctx.fillText("力限 ±" + state.fMax.toFixed(2), 60, 58);
      ctx.fillText("实际电机力 " + applied.toFixed(2), 330, 40);
      ctx.fillStyle = state.inside ? VBW.c("interactive") : "#e0463c";
      ctx.fillText(state.inside
        ? "求解内：力是未知量，接触可把 λ_drive 再谈低"
        : "求解外：先截断再投影，接触无法回头改电机账", 60, 250);
    }

    const r1 = VBW.row();
    r1.appendChild(VBW.slider("位置误差", 0, 1.5, 0.01, state.err, (v) => { state.err = v; draw(); }, (v) => v.toFixed(2)).wrap);
    r1.appendChild(VBW.slider("刚度 k", 0.2, 4, 0.1, state.k, (v) => { state.k = v; draw(); }, (v) => v.toFixed(1)).wrap);
    const r2 = VBW.row();
    r2.appendChild(VBW.slider("f_max", 0.1, 2, 0.05, state.fMax, (v) => { state.fMax = v; draw(); }, (v) => v.toFixed(2)).wrap);
    r2.appendChild(VBW.seg(
      [{ label: "求解内", value: true }, { label: "求解外截断", value: false }],
      state.inside,
      (v) => { state.inside = v; draw(); }
    ));
    root.appendChild(cv); root.appendChild(r1); root.appendChild(r2);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
