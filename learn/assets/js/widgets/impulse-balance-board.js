/* impulse-balance-board — 四类冲量一次谈妥的直觉板 */
(function () {
  window.VBWidgets["impulse-balance-board"] = function (root) {
    const W = 560, H = 240;
    const state = { mimic: 0.4, drive: 0.7, normal: 0.8, friction: 0.5 };
    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function residual() {
      // toy: imbalance if drive wants close but normal/friction can't answer with mimic consistency
      const need = state.drive;
      const supply = 0.5 * state.normal + 0.35 * state.friction + 0.25 * state.mimic;
      return Math.abs(need - supply);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const keys = [
        { k: "mimic", lab: "λ_mimic", col: VBW.c("pbd") || "#c98a2b" },
        { k: "drive", lab: "λ_drive", col: VBW.c("interactive") },
        { k: "normal", lab: "λ_n", col: VBW.c("accent") || "#6b5bd6" },
        { k: "friction", lab: "λ_t", col: "#2a9d8f" },
      ];
      keys.forEach((K, i) => {
        const x = 70 + i * 120;
        const h = state[K.k] * 140;
        ctx.fillStyle = K.col; ctx.globalAlpha = 0.85;
        ctx.fillRect(x, 180 - h, 44, h);
        ctx.globalAlpha = 1;
        ctx.fillStyle = VBW.c("ink"); ctx.font = "12px var(--mono)"; ctx.textAlign = "center";
        ctx.fillText(K.lab, x + 22, 200);
        ctx.fillText(state[K.k].toFixed(2), x + 22, 170 - h);
      });
      const r = residual();
      ctx.textAlign = "left";
      ctx.fillStyle = r < 0.12 ? VBW.c("interactive") : "#e0463c";
      ctx.font = "13px var(--mono)";
      ctx.fillText(r < 0.12 ? "残差小：一次谈妥，可以统一写回 q/qd" : ("残差 " + r.toFixed(2) + "：还在互相抢"), 24, 28);
    }

    function addSlider(label, key) {
      return VBW.slider(label, 0, 1, 0.01, state[key], (v) => { state[key] = v; draw(); }, (v) => v.toFixed(2)).wrap;
    }
    const r1 = VBW.row();
    r1.appendChild(addSlider("mimic", "mimic"));
    r1.appendChild(addSlider("drive", "drive"));
    const r2 = VBW.row();
    r2.appendChild(addSlider("normal", "normal"));
    r2.appendChild(addSlider("friction", "friction"));
    root.appendChild(cv); root.appendChild(r1); root.appendChild(r2);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
