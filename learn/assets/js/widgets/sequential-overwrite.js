/* sequential-overwrite — mimic→drive→contact 轮流写，末尾硬 mimic 覆盖接触摆位 */
(function () {
  window.VBWidgets["sequential-overwrite"] = function (root) {
    const W = 560, H = 220;
    const c = (n) => VBW.c(n);
    const state = { phase: 0 }; // 0 mimic, 1 drive, 2 contact, 3 mimic again
    const phases = ["1 · hard mimic", "2 · drive", "3 · contact", "4 · mimic 再覆盖"];
    // A slightly off-center block makes mimic and bilateral contact conflict.
    let qL = -0.12, qR = 0.12;
    const obj = { x: 0.02, half: 0.12 };

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function applyPhase(p) {
      if (p === 0) { qL = -0.12; qR = -qL; }
      if (p === 1) { qL = -0.08; qR = 0.12; } // leader drive closes
      if (p === 2) { qL = obj.x - obj.half; qR = obj.x + obj.half; } // contact places both
      if (p === 3) { qL = obj.x - obj.half; qR = -qL; } // overwrite: right crosses the contact face
    }

    function draw() {
      applyPhase(state.phase);
      ctx.clearRect(0, 0, W, H);
      const map = (q) => 280 + q * 520;
      const y = 120;
      // object
      ctx.fillStyle = c("accent") || "#6b5bd6";
      ctx.globalAlpha = 0.35;
      ctx.fillRect(map(obj.x - obj.half), y - 36, map(obj.x + obj.half) - map(obj.x - obj.half), 72);
      ctx.globalAlpha = 1;
      // jaws
      ctx.fillStyle = c("interactive");
      ctx.fillRect(map(qL) - 10, y - 50, 20, 100);
      ctx.fillRect(map(qR) - 10, y - 50, 20, 100);
      // labels
      ctx.fillStyle = c("ink"); ctx.font = "13px var(--mono)"; ctx.textAlign = "center";
      ctx.fillText(phases[state.phase], W / 2, 28);
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
      ctx.fillText("qL=" + qL.toFixed(2) + "  qR=" + qR.toFixed(2) + "  |  接触面 -0.10 / +0.14", W / 2, H - 18);
      if (state.phase === 3) {
        ctx.fillStyle = "#e0463c";
        ctx.fillText("follower 被 hard mimic 写过右侧接触面 → 双侧夹紧被破坏", W / 2, 50);
      }
      ctx.textAlign = "left";
    }

    const r = VBW.row();
    r.appendChild(VBW.seg(
      phases.map((lab, i) => ({ label: String(i + 1), value: i })),
      state.phase,
      (v) => { state.phase = v; draw(); }
    ));
    const hint = VBW.el("div", { class: "ctrl" }, "<label><span>点 1→4 看覆盖</span></label>");
    r.appendChild(hint);
    root.appendChild(cv); root.appendChild(r);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
