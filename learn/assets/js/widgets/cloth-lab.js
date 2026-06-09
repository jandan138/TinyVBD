/* cloth-lab — 一块真正在浏览器里跑 VBD 的 2D 三角网格 cloth。
   求解器来自 cloth-core.js（Newton particle VBD 的 2D 忠实移植）。
   可调 stiffness / 迭代数 / bending；可拖动顶点；可切换按 color 上色看并行分组。 */
(function () {
  window.VBWidgets["cloth-lab"] = function (root) {
    const W = 600, H = 420;
    const c = (n) => VBW.c(n);
    const state = { stiffness: 1e3, iters: 20, bendExp: -1, showColors: false, running: true };
    let cloth = null, dragIdx = -1;

    function rebuild() {
      cloth = new VBW.Cloth({
        cols: 13, rows: 13, spacing: 0.06,
        stiffness: state.stiffness, bend: state.bendExp <= -3 ? 0 : Math.pow(10, state.bendExp),
        gravity: -10, dt: 1 / 60, mass: 0.2,
      });
    }
    rebuild();

    const wx0 = -0.55, wx1 = 0.55, wy0 = -0.95, wy1 = 0.15;
    const sc = Math.min(W / (wx1 - wx0), H / (wy1 - wy0));
    const ox = (W - sc * (wx1 - wx0)) / 2, oy = (H - sc * (wy1 - wy0)) / 2;
    const X = (x) => ox + (x - wx0) * sc;
    const Y = (y) => H - oy - (y - wy0) * sc;
    const invX = (px) => (px - ox) / sc + wx0;
    const invY = (py) => (H - oy - py) / sc + wy0;

    const cv = VBW.el("canvas");
    const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px;cursor:grab";

    const palette = ["#0e7490", "#9333ea", "#c2660a", "#2563eb", "#dc2626", "#16a34a", "#db2777", "#0891b2"];

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.strokeStyle = c("border-strong");
      for (const e of cloth.edges) {
        ctx.beginPath();
        ctx.moveTo(X(cloth.px[e.a]), Y(cloth.py[e.a]));
        ctx.lineTo(X(cloth.px[e.b]), Y(cloth.py[e.b]));
        ctx.stroke();
      }
      for (let i = 0; i < cloth.n; i++) {
        ctx.beginPath();
        ctx.arc(X(cloth.px[i]), Y(cloth.py[i]), cloth.pinned[i] ? 4 : 2.6, 0, 2 * Math.PI);
        if (state.showColors) ctx.fillStyle = palette[cloth.colorOf[i] % palette.length];
        else ctx.fillStyle = cloth.pinned[i] ? c("warn") : c("interactive");
        ctx.fill();
      }
    }

    function frame() {
      if (state.running) cloth.step(state.iters);
      if (dragIdx >= 0) { cloth.vx[dragIdx] = 0; cloth.vy[dragIdx] = 0; }
      draw();
      raf = requestAnimationFrame(frame);
    }
    let raf = 0;

    // drag
    function pick(px, py) {
      const wx = invX(px), wy = invY(py); let best = -1, bd = 0.05;
      for (let i = 0; i < cloth.n; i++) {
        const d = Math.hypot(cloth.px[i] - wx, cloth.py[i] - wy);
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }
    cv.addEventListener("pointerdown", (ev) => {
      const r = cv.getBoundingClientRect();
      dragIdx = pick(ev.clientX - r.left, ev.clientY - r.top);
      if (dragIdx >= 0) cv.setPointerCapture(ev.pointerId);
    });
    cv.addEventListener("pointermove", (ev) => {
      if (dragIdx < 0) return;
      const r = cv.getBoundingClientRect();
      cloth.px[dragIdx] = invX(ev.clientX - r.left);
      cloth.py[dragIdx] = invY(ev.clientY - r.top);
    });
    cv.addEventListener("pointerup", () => { dragIdx = -1; });

    // controls
    const controls = VBW.el("div", { class: "ctrl-row" });
    const sStiff = VBW.slider("stiffness k", 2, 5, 0.1, Math.log10(state.stiffness),
      (v) => { state.stiffness = Math.pow(10, v); rebuild(); }, (v) => "1e" + v.toFixed(1));
    const sIter = VBW.slider("iterations", 1, 60, 1, state.iters, (v) => { state.iters = v; }, (v) => v | 0);
    const sBend = VBW.slider("bending", -3, 1, 0.5, state.bendExp,
      (v) => { state.bendExp = v; rebuild(); }, (v) => (v <= -3 ? "off" : "1e" + v.toFixed(1)));
    controls.appendChild(sStiff.wrap); controls.appendChild(sIter.wrap); controls.appendChild(sBend.wrap);
    const row2 = VBW.el("div", { class: "ctrl-row" });
    row2.appendChild(VBW.toggle("show colors", state.showColors, (v) => { state.showColors = v; }));
    row2.appendChild(VBW.toggle("running", state.running, (v) => { state.running = v; }));
    const reset = VBW.el("button", { class: "btn" }, "reset");
    reset.addEventListener("click", () => rebuild());
    row2.appendChild(reset);

    root.appendChild(cv);
    root.appendChild(controls);
    root.appendChild(row2);
    frame();
  };
})();
