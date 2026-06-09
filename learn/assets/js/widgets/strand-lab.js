/* strand-lab — 一个真正在浏览器里跑 VBD 的 strand 仿真器。
   求解器来自 vbd-core.js（忠实移植 TinyVBD 的 solve()/forwardStep()）。
   可调 stiffness / 末端质量比 / 迭代数 / Chebyshev / skip spring；可用鼠标拖动顶点。 */
(function () {
  window.VBWidgets["strand-lab"] = function (root) {
    const W = 600, H = 360;
    const c = (n) => VBW.c(n);

    const state = {
      stiffness: 1e5, mTipExp: 0, numIter: 20,
      cheby: false, rho: 0.95, skip: false, running: true,
    };
    let strand = null, dragIdx = -1, dragPos = null;

    function rebuild() {
      strand = new VBW.Strand({
        numVerts: 20, dis: 0.05, stiffness: state.stiffness,
        m0: 1, mTip: Math.pow(10, state.mTipExp),
        tanAngle: 0.3, skipSpring: state.skip, skipStiffness: 100,
        gravity: -10, useChebyshev: state.cheby, rho: state.rho,
      });
    }
    rebuild();

    // viewport：世界 -> 屏幕
    const wx0 = -0.15, wx1 = 1.15, wy0 = -0.75, wy1 = 1.05;
    const sx = W / (wx1 - wx0), sy = H / (wy1 - wy0);
    const sc = Math.min(sx, sy);
    const ox = (W - sc * (wx1 - wx0)) / 2, oy = (H - sc * (wy1 - wy0)) / 2;
    const X = (x) => ox + (x - wx0) * sc;
    const Y = (y) => H - oy - (y - wy0) * sc;  // y 向上
    const invX = (px) => (px - ox) / sc + wx0;
    const invY = (py) => (H - oy - py) / sc + wy0;

    const cv = VBW.el("canvas");
    const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;background:var(--surface-2);border-radius:10px;cursor:grab";

    function maxStretch() {
      let m = 0;
      for (const e of strand.edges) {
        const l = Math.hypot(strand.px[e.a] - strand.px[e.b], strand.py[e.a] - strand.py[e.b]);
        m = Math.max(m, Math.abs(l - e.l0) / e.l0);
      }
      return m * 100;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const n = strand.n;
      // 地板参考线
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1;
      // skip springs（弯曲）先画淡线
      strand.edges.forEach((e) => {
        if (e.b - e.a === 2) {
          ctx.beginPath();
          ctx.moveTo(X(strand.px[e.a]), Y(strand.py[e.a]));
          ctx.lineTo(X(strand.px[e.b]), Y(strand.py[e.b]));
          ctx.strokeStyle = c("pbd") + "66"; ctx.lineWidth = 1; ctx.stroke();
        }
      });
      // 结构弹簧：按拉伸量上色
      strand.edges.forEach((e) => {
        if (e.b - e.a !== 1) return;
        const l = Math.hypot(strand.px[e.a] - strand.px[e.b], strand.py[e.a] - strand.py[e.b]);
        const st = (l - e.l0) / e.l0;
        const t = VBW.clamp(Math.abs(st) * 12, 0, 1);
        const col = st > 0 ? [220, 70, 70] : [70, 130, 220];
        ctx.beginPath();
        ctx.moveTo(X(strand.px[e.a]), Y(strand.py[e.a]));
        ctx.lineTo(X(strand.px[e.b]), Y(strand.py[e.b]));
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.35 + 0.65 * t})`;
        ctx.lineWidth = 2.4; ctx.stroke();
      });
      // 顶点
      for (let i = 0; i < n; i++) {
        const r = i === n - 1 ? 7 : (i === 0 ? 6 : 3.4);
        ctx.beginPath(); ctx.arc(X(strand.px[i]), Y(strand.py[i]), r, 0, 7);
        if (i === 0) ctx.fillStyle = c("ink");
        else if (i === n - 1) ctx.fillStyle = c("accent");
        else ctx.fillStyle = c("interactive");
        ctx.fill();
        if (i === 0) { // pin 标记
          ctx.strokeStyle = c("ink"); ctx.lineWidth = 1.5; ctx.beginPath();
          ctx.arc(X(strand.px[i]), Y(strand.py[i]), 10, 0, 7); ctx.stroke();
        }
      }
      // 末端质量标注
      const tipM = Math.pow(10, state.mTipExp);
      ctx.fillStyle = c("ink-soft"); ctx.font = "11px monospace";
      ctx.fillText("tip m=" + (tipM >= 1 ? tipM.toFixed(0) : tipM) + "×", X(strand.px[n - 1]) + 10, Y(strand.py[n - 1]));
      ctx.fillText("pinned", X(strand.px[0]) + 12, Y(strand.py[0]) - 8);
      // 读数
      ctx.fillStyle = c("ink-soft");
      ctx.fillText("frame " + strand.frame + "   max stretch ≈ " + maxStretch().toFixed(2) + "%   iters=" + state.numIter, 12, H - 12);
    }

    function physics() {
      const dt = 1 / 60;
      strand.useChebyshev = state.cheby; strand.rho = state.rho;
      strand.step(dt, state.numIter);
      if (dragIdx > 0 && dragPos) {     // 拖动：把该顶点钉到鼠标
        strand.px[dragIdx] = dragPos.x; strand.py[dragIdx] = dragPos.y;
        strand.vx[dragIdx] = 0; strand.vy[dragIdx] = 0;
      }
    }

    let raf = null;
    function loop() {
      if (state.running && !VBW.reduced) physics();
      draw();
      raf = requestAnimationFrame(loop);
    }

    // 鼠标拖动
    function pick(px, py) {
      const wx = invX(px), wy = invY(py);
      let best = -1, bd = 1e9;
      for (let i = 1; i < strand.n; i++) {
        const d = Math.hypot(strand.px[i] - wx, strand.py[i] - wy);
        if (d < bd) { bd = d; best = i; }
      }
      return bd < 0.08 ? best : -1;
    }
    function evt(e) {
      const r = cv.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { px: t.clientX - r.left, py: t.clientY - r.top };
    }
    cv.addEventListener("mousedown", (e) => {
      const p = evt(e); dragIdx = pick(p.px, p.py);
      if (dragIdx > 0) { dragPos = { x: invX(p.px), y: invY(p.py) }; cv.style.cursor = "grabbing"; }
    });
    window.addEventListener("mousemove", (e) => {
      if (dragIdx > 0) { const p = evt(e); dragPos = { x: invX(p.px), y: invY(p.py) }; }
    });
    window.addEventListener("mouseup", () => { dragIdx = -1; dragPos = null; cv.style.cursor = "grab"; });

    // 控件
    const row1 = VBW.row();
    const sStiff = VBW.slider("stiffness (log₁₀)", 3, 8, 0.5, 5, (v) => { state.stiffness = Math.pow(10, v); rebuild(); }, (v) => "1e" + v);
    const sTip = VBW.slider("末端质量比 mTip (log₁₀)", 0, 3, 1, 0, (v) => { state.mTipExp = v; rebuild(); }, (v) => Math.pow(10, v) + "×");
    const sIter = VBW.slider("迭代数 numIterations", 1, 100, 1, 20, (v) => { state.numIter = v; });
    row1.appendChild(sStiff.wrap); row1.appendChild(sTip.wrap); row1.appendChild(sIter.wrap);

    const row2 = VBW.row();
    row2.appendChild(VBW.toggle("Chebyshev 加速", false, (v) => { state.cheby = v; }));
    const sRho = VBW.slider("ρ (spectral radius)", 0, 0.99, 0.01, 0.95, (v) => { state.rho = v; });
    row2.appendChild(sRho.wrap);
    row2.appendChild(VBW.toggle("skip spring（弯曲）", false, (v) => { state.skip = v; rebuild(); }));

    const row3 = VBW.el("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin-top:6px" });
    const playBtn = VBW.el("button", { class: "btn primary" }, "⏸ 暂停");
    const resetBtn = VBW.el("button", { class: "btn" }, "↻ 重置");
    const poke = VBW.el("button", { class: "btn" }, "↯ 给末端一脚");
    playBtn.addEventListener("click", () => { state.running = !state.running; playBtn.textContent = state.running ? "⏸ 暂停" : "▶ 播放"; });
    resetBtn.addEventListener("click", () => { rebuild(); });
    poke.addEventListener("click", () => { strand.vx[strand.n - 1] += 6; strand.vy[strand.n - 1] += 4; });
    row3.appendChild(playBtn); row3.appendChild(resetBtn); row3.appendChild(poke);

    root.appendChild(cv); root.appendChild(row1); root.appendChild(row2); root.appendChild(row3);
    window.addEventListener("themechange", draw);
    loop();
  };
})();
