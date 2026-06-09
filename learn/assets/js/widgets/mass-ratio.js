/* mass-ratio — 同一条「末端极重」的 strand，VBD（primal）vs PBD-style 位置投影（dual-ish）。
   高质量比下，PBD 的修正按逆质量分配：重末端几乎不动、轻链节被甩，少迭代时撑不住重量→过度拉伸；
   VBD 在每个顶点的牛顿步里直接平衡力（含重惯性项），轻松保持紧绷。 */
(function () {
  window.VBWidgets["mass-ratio"] = function (root) {
    const W = 560, H = 340, dt = 1 / 60;
    const c = (n) => VBW.c(n);
    let mExp = 3, numIter = 20, running = true;
    const N = 16, DIS = 0.05, STIFF = 1e5, TAN = 0.3, G = -10;

    let vbd, pbd;
    function rebuild() {
      vbd = new VBW.Strand({ numVerts: N, dis: DIS, stiffness: STIFF, m0: 1, mTip: Math.pow(10, mExp), tanAngle: TAN, gravity: G });
      pbd = makePBD();
    }
    function makePBD() {
      const n = N; const o = { px: new Float64Array(n), py: new Float64Array(n), vx: new Float64Array(n), vy: new Float64Array(n), m: new Float64Array(n), edges: [] };
      for (let i = 0; i < n; i++) { o.px[i] = i * DIS; o.py[i] = 0.85 + i * DIS * TAN; o.m[i] = i === n - 1 ? Math.pow(10, mExp) : 1; }
      for (let i = 0; i < n - 1; i++) o.edges.push({ a: i, b: i + 1, l0: Math.hypot(o.px[i + 1] - o.px[i], o.py[i + 1] - o.py[i]) });
      return o;
    }
    function stepPBD(o, iters) {
      const n = o.px.length;
      const oldx = o.px.slice(), oldy = o.py.slice();
      for (let i = 1; i < n; i++) { o.vy[i] += dt * G; o.px[i] += dt * o.vx[i]; o.py[i] += dt * o.vy[i]; }
      for (let it = 0; it < iters; it++) {
        for (const e of o.edges) {
          const wa = e.a === 0 ? 0 : 1 / o.m[e.a], wb = 1 / o.m[e.b];
          let dx = o.px[e.a] - o.px[e.b], dy = o.py[e.a] - o.py[e.b];
          const l = Math.hypot(dx, dy) || 1e-9; const C = l - e.l0; const ws = wa + wb; if (ws === 0) continue;
          const s = C / (ws * l);
          o.px[e.a] -= wa * s * dx; o.py[e.a] -= wa * s * dy;
          o.px[e.b] += wb * s * dx; o.py[e.b] += wb * s * dy;
        }
      }
      for (let i = 1; i < n; i++) { o.vx[i] = (o.px[i] - oldx[i]) / dt; o.vy[i] = (o.py[i] - oldy[i]) / dt; }
    }
    function maxStretch(px, py, edges) {
      let m = 0; for (const e of edges) { const l = Math.hypot(px[e.a] - px[e.b], py[e.a] - py[e.b]); m = Math.max(m, Math.abs(l - e.l0) / e.l0); } return m * 100;
    }
    rebuild();

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;background:var(--surface-2);border-radius:10px";

    function drawStrand(px, py, edges, x0, label, stretch) {
      const wx0 = -0.1, wy0 = -0.95, span = 1.3;
      const sc = (H - 50) / span;
      const X = (x) => x0 + 70 + (x - wx0) * sc * 0.7;
      const Y = (y) => 30 + (-(y) + 0.95) * sc;
      for (const e of edges) {
        const l = Math.hypot(px[e.a] - px[e.b], py[e.a] - py[e.b]); const st = (l - e.l0) / e.l0;
        const t = VBW.clamp(Math.abs(st) * 8, 0, 1);
        ctx.strokeStyle = st > 0.02 ? `rgba(224,70,60,${0.4 + 0.6 * t})` : c("interactive");
        ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(X(px[e.a]), Y(py[e.a])); ctx.lineTo(X(px[e.b]), Y(py[e.b])); ctx.stroke();
      }
      for (let i = 0; i < px.length; i++) {
        ctx.beginPath(); ctx.arc(X(px[i]), Y(py[i]), i === px.length - 1 ? 7 : (i === 0 ? 5 : 3), 0, 7);
        ctx.fillStyle = i === 0 ? c("ink") : (i === px.length - 1 ? c("accent") : c("interactive")); ctx.fill();
      }
      ctx.fillStyle = c("ink"); ctx.font = "13px monospace"; ctx.fillText(label, x0 + 50, 20);
      ctx.fillStyle = stretch > 8 ? "#e0463c" : c("ink-soft"); ctx.font = "12px monospace";
      ctx.fillText("max stretch " + stretch.toFixed(1) + "%", x0 + 40, H - 12);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = c("border"); ctx.beginPath(); ctx.moveTo(W / 2, 24); ctx.lineTo(W / 2, H - 24); ctx.stroke();
      drawStrand(vbd.px, vbd.py, vbd.edges, 0, "VBD", maxStretch(vbd.px, vbd.py, vbd.edges));
      drawStrand(pbd.px, pbd.py, pbd.edges, W / 2, "PBD-style", maxStretch(pbd.px, pbd.py, pbd.edges));
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px monospace";
      ctx.fillText("tip 质量 = " + Math.pow(10, mExp) + "× · iters=" + numIter, 12, H - 12);
    }

    let raf = null;
    function loop() {
      if (running && !VBW.reduced) { vbd.step(dt, numIter); stepPBD(pbd, numIter); }
      draw(); raf = requestAnimationFrame(loop);
    }

    const ctrls = VBW.row();
    const sM = VBW.slider("末端质量比 (log₁₀)", 0, 4, 1, mExp, (v) => { mExp = v; rebuild(); }, (v) => Math.pow(10, v) + "×");
    const sI = VBW.slider("迭代数", 1, 60, 1, numIter, (v) => { numIter = v; });
    ctrls.appendChild(sM.wrap); ctrls.appendChild(sI.wrap);
    const bRow = VBW.el("div", { style: "display:flex;gap:8px;margin-top:6px" });
    const pb = VBW.el("button", { class: "btn primary" }, "⏸ 暂停"); const rb = VBW.el("button", { class: "btn" }, "↻ 重置");
    pb.addEventListener("click", () => { running = !running; pb.textContent = running ? "⏸ 暂停" : "▶ 播放"; });
    rb.addEventListener("click", rebuild); bRow.appendChild(pb); bRow.appendChild(rb);
    root.appendChild(cv); root.appendChild(ctrls); root.appendChild(bRow);
    window.addEventListener("themechange", draw);
    loop();
  };
})();
