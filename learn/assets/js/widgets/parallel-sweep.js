/* parallel-sweep — 按 color 的并行 Gauss-Seidel 动画：同色顶点同时更新、颜色依次推进，
   与 TinyVBD 串行(一次一个顶点) sweep 并排。说明颜色数 = 串行阶段数。 */
(function () {
  window.VBWidgets["parallel-sweep"] = function (root) {
    const c = (n) => VBW.c(n);
    const cols = 9, rows = 5, n = cols * rows;
    // 2-coloring of a grid (checkerboard) for the "parallel" panel
    const colorOf = new Int32Array(n);
    for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) colorOf[r * cols + cc] = (r + cc) % 2;
    const ncolors = 2;
    const W = 560, H = 260, s = 56, x0 = 40, y0 = 40;
    const P = (i) => ({ x: x0 + (i % cols) * s, y: y0 + Math.floor(i / cols) * s });
    const palette = ["#0e7490", "#9333ea"];
    let phase = 0, serialIdx = 0, mode = "parallel", t = 0;
    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < n; i++) {
        const p = P(i);
        const on = mode === "parallel" ? colorOf[i] === phase : i === serialIdx;
        ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 2 * Math.PI);
        ctx.fillStyle = on ? palette[colorOf[i]] : c("border-strong");
        ctx.fill();
        if (on) { ctx.lineWidth = 3; ctx.strokeStyle = c("ink"); ctx.stroke(); }
      }
    }
    const cap = VBW.el("div", { class: "lab-cap" });
    function updateCap() {
      cap.innerHTML = mode === "parallel"
        ? "并行：当前更新 color <b>" + phase + "</b> 的所有顶点（同时）。" + ncolors + " 个 color → 每个 sweep 只有 " + ncolors + " 个串行阶段。"
        : "串行(TinyVBD 式)：一次只更新一个顶点 #" + serialIdx + "。" + n + " 个顶点 → " + n + " 个串行阶段。";
    }
    function tick() {
      t++;
      if (t % 30 === 0) {
        if (mode === "parallel") phase = (phase + 1) % ncolors;
        else serialIdx = (serialIdx + 1) % n;
        draw(); updateCap();
      }
      raf = requestAnimationFrame(tick);
    }
    let raf = 0;
    const seg = VBW.seg(
      [{ label: "并行 by color", value: "parallel" }, { label: "串行 TinyVBD", value: "serial" }],
      mode, (v) => { mode = v; phase = 0; serialIdx = 0; draw(); updateCap(); });
    root.appendChild(cv); root.appendChild(seg); root.appendChild(cap);
    draw(); updateCap(); tick();
  };
})();
