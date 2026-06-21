/* friction-smooth — IPC 把 Coulomb 摩擦光滑化（mollified）成可微。
   理想 Coulomb：相对滑移速度过零时摩擦力从 +μN 瞬间跳到 -μN（不连续阶跃，Newton 不友好）。
   IPC 在 |v| < ε_v 的过渡区把它抹成一条光滑曲线（可微），区外仍是 ±μN。
   调 ε_v 看过渡区宽窄；调 μN 看饱和值。 */
(function () {
  window.VBWidgets["friction-smooth"] = function (root) {
    const W = 560, H = 300, PAD = 44;
    const c = (n) => VBW.c(n);
    const state = { epsv: 0.25, muN: 1.0, showIdeal: true };

    // 光滑化摩擦：|v|≥ε_v → μN·sign(v)；|v|<ε_v → μN·f(v/ε_v)，f 单调、f(±1)=±1、f'(0) 有限。
    // 用常见的二次抹平 f(s) = s(2 - |s|)（s∈[-1,1]），保证连续且过零可微。
    function smooth(v) {
      const e = state.epsv, m = state.muN;
      if (v >= e) return m;
      if (v <= -e) return -m;
      const s = v / e;
      return m * s * (2 - Math.abs(s));
    }
    function ideal(v) {
      const m = state.muN;
      if (v > 1e-6) return m;
      if (v < -1e-6) return -m;
      return 0;
    }

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    const VR = 1.2;   // 速度横轴范围 [-VR, VR]
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const yMax = Math.max(1.2, state.muN * 1.25);
      const PX = (v) => PAD + (v + VR) / (2 * VR) * (W - 2 * PAD);
      const PY = (f) => (H / 2) - (f / yMax) * (H / 2 - PAD);

      // 轴
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, H - PAD); // y
      ctx.moveTo(PAD, H / 2); ctx.lineTo(W - PAD, H / 2); ctx.stroke();  // x (f=0)
      // ε_v 过渡区阴影
      ctx.fillStyle = c("warn"); ctx.globalAlpha = 0.12;
      ctx.fillRect(PX(-state.epsv), PAD, PX(state.epsv) - PX(-state.epsv), H - 2 * PAD);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = c("warn"); ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(PX(state.epsv), PAD); ctx.lineTo(PX(state.epsv), H - PAD);
      ctx.moveTo(PX(-state.epsv), PAD); ctx.lineTo(PX(-state.epsv), H - PAD); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = c("warn"); ctx.font = "11px var(--mono)";
      ctx.fillText("±ε_v 过渡区", PX(state.epsv) + 6, PAD + 12);

      // 理想 Coulomb（阶跃）
      if (state.showIdeal) {
        ctx.strokeStyle = c("ink-faint"); ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(PX(-VR), PY(-state.muN)); ctx.lineTo(PX(0), PY(-state.muN));
        ctx.moveTo(PX(0), PY(state.muN)); ctx.lineTo(PX(VR), PY(state.muN));
        ctx.stroke();
        // 竖直跳变
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(PX(0), PY(-state.muN)); ctx.lineTo(PX(0), PY(state.muN)); ctx.stroke();
        ctx.setLineDash([]);
      }
      // 光滑化曲线
      ctx.strokeStyle = c("interactive"); ctx.lineWidth = 2.6; ctx.beginPath();
      const N = 240; let started = false;
      for (let i = 0; i <= N; i++) {
        const v = -VR + (i / N) * 2 * VR;
        const x = PX(v), y = PY(smooth(v));
        started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true;
      }
      ctx.stroke();

      // 标签
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
      ctx.fillText("摩擦力 f_T", 6, PAD - 4);
      ctx.fillText("相对滑移速度 v →", W - PAD - 110, H / 2 + 16);
      ctx.fillStyle = c("ink-soft");
      ctx.fillText("+μN", PX(VR) - 28, PY(state.muN) - 6);
      ctx.fillText("−μN", PX(-VR) + 4, PY(-state.muN) + 14);

      // 图例
      let ly = PAD + 2;
      ctx.fillStyle = c("interactive"); ctx.fillRect(W - 210, ly, 14, 3);
      ctx.fillStyle = c("ink-soft"); ctx.fillText("IPC 光滑化（可微）", W - 190, ly + 4);
      if (state.showIdeal) {
        ly += 16; ctx.fillStyle = c("ink-faint"); ctx.fillRect(W - 210, ly, 14, 3);
        ctx.fillStyle = c("ink-soft"); ctx.fillText("理想 Coulomb（阶跃）", W - 190, ly + 4);
      }
    }

    const r1 = VBW.row();
    r1.appendChild(VBW.slider("ε_v (过渡区半宽)", 0.05, 0.6, 0.05, state.epsv, (v) => { state.epsv = v; draw(); }, (v) => v.toFixed(2)).wrap);
    r1.appendChild(VBW.slider("μN (饱和摩擦力)", 0.3, 1.5, 0.1, state.muN, (v) => { state.muN = v; draw(); }, (v) => v.toFixed(1)).wrap);
    r1.appendChild(VBW.toggle("叠加理想 Coulomb", state.showIdeal, (v) => { state.showIdeal = v; draw(); }));

    root.appendChild(cv); root.appendChild(r1);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
