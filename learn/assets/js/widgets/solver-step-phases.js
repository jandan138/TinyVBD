/* solver-step-phases — 8-2 SolverVBD.step() 的三段式 + substep×iteration 嵌套时间线。
   横向时间线：initialize → [substep × (iterate: per-color sweep)] → finalize。
   hover/点一个阶段把它映射回 TinyVBD 的对应方法。调 substeps / iterations / colors 看嵌套展开。 */
(function () {
  window.VBWidgets["solver-step-phases"] = function (root) {
    const W = 560, H = 300; const c = (n) => VBW.c(n);
    const state = { substeps: 2, iters: 3, colors: 3, hover: -1 };
    const map = {
      init: "initialize：前向积分惯性 y + penetration-free 截断 ≈ TinyVBD forwardStep()",
      sweep: "per-color sweep：对该颜色顶点解 3×3 牛顿步 Δx=H⁻¹f ≈ TinyVBD solve() 的一遍",
      fin: "finalize：由位移算速度 v=(x-x_prev)/h ≈ TinyVBD updateVelocity()",
    };

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    let blocks = [];
    function layout() {
      blocks = []; let x = 20; const y = 60, h = 34;
      blocks.push({ x, w: 70, y, h, kind: "init", label: "init" }); x += 78;
      for (let s = 0; s < state.substeps; s++) {
        const subX = x; let inner = x + 6;
        for (let it = 0; it < state.iters; it++) {
          for (let cl = 0; cl < state.colors; cl++) {
            blocks.push({ x: inner, w: 16, y: y + 4, h: h - 8, kind: "sweep", label: "", sub: s, it, cl }); inner += 18;
          }
          inner += 4;
        }
        blocks.push({ x: subX - 3, w: inner - subX + 3, y: y - 10, h: h + 20, kind: "subbox", label: "substep " + (s + 1) }); // 背景框
        x = inner + 10;
      }
      blocks.push({ x, w: 70, y, h, kind: "fin", label: "finalize" });
      // 把 subbox 排前面画（背景）
      blocks.sort((a, b) => (a.kind === "subbox" ? -1 : 0) - (b.kind === "subbox" ? -1 : 0));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.font = "12px var(--mono)"; ctx.fillStyle = c("ink");
      ctx.fillText("step() 一次调用的时间线（→ 时间）", 20, 30);
      blocks.forEach((b, i) => {
        if (b.kind === "subbox") { ctx.fillStyle = "rgba(120,120,140,.08)"; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeStyle = c("border"); ctx.strokeRect(b.x, b.y, b.w, b.h); ctx.fillStyle = c("ink-faint"); ctx.font = "10px var(--mono)"; ctx.fillText(b.label, b.x + 2, b.y - 2); return; }
        const hov = i === state.hover;
        const col = b.kind === "init" ? (c("tv") || "#3bb3a8") : b.kind === "fin" ? (c("accent") || "#6b5bd6") : c("interactive");
        ctx.fillStyle = hov ? c("ink") : col; ctx.fillRect(b.x, b.y, b.w, b.h);
        if (b.label) { ctx.fillStyle = "#fff"; ctx.font = "11px var(--mono)"; ctx.fillText(b.label, b.x + 6, b.y + b.h / 2 + 4); }
      });
      // 图例
      ctx.font = "11px var(--mono)";
      ctx.fillStyle = c("tv") || "#3bb3a8"; ctx.fillRect(20, 120, 12, 12); ctx.fillStyle = c("ink-soft"); ctx.fillText("initialize", 38, 130);
      ctx.fillStyle = c("interactive"); ctx.fillRect(130, 120, 12, 12); ctx.fillStyle = c("ink-soft"); ctx.fillText("per-color sweep（小格 = 一个颜色一遍）", 148, 130);
      ctx.fillStyle = c("accent") || "#6b5bd6"; ctx.fillRect(20, 140, 12, 12); ctx.fillStyle = c("ink-soft"); ctx.fillText("finalize", 38, 150);
      // 计数
      const total = state.substeps * state.iters * state.colors;
      ctx.fillStyle = c("ink"); ctx.font = "12px var(--mono)";
      ctx.fillText(`一次 step()= 1 init + ${state.substeps}×${state.iters}×${state.colors} = ${total} 次 per-color sweep + 1 finalize`, 20, 178);
      // 映射说明
      ctx.fillStyle = c("ink-soft"); ctx.font = "11px var(--mono)";
      const m = state.hover >= 0 && blocks[state.hover] ? map[blocks[state.hover].kind] : "把鼠标移到色块上，看它对应 TinyVBD 的哪个方法";
      let line = "", yy = 204; (m || "").split("").forEach((ch) => { if (ctx.measureText(line + ch).width > W - 40) { ctx.fillText(line, 20, yy); line = ch; yy += 16; } else line += ch; }); ctx.fillText(line, 20, yy);
    }

    cv.addEventListener("mousemove", (e) => {
      const rct = cv.getBoundingClientRect(); const mx = e.clientX - rct.left, my = e.clientY - rct.top;
      let h = -1; blocks.forEach((b, i) => { if (b.kind !== "subbox" && mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) h = i; });
      if (h !== state.hover) { state.hover = h; draw(); }
    });
    const r1 = VBW.row();
    r1.appendChild(VBW.slider("substeps", 1, 4, 1, state.substeps, (v) => { state.substeps = v | 0; layout(); draw(); }).wrap);
    r1.appendChild(VBW.slider("iterations", 1, 5, 1, state.iters, (v) => { state.iters = v | 0; layout(); draw(); }).wrap);
    r1.appendChild(VBW.slider("colors", 2, 5, 1, state.colors, (v) => { state.colors = v | 0; layout(); draw(); }).wrap);
    root.appendChild(cv); root.appendChild(r1);
    const cap = VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "step() 一次调用 = initialize → 每个 substep 内跑 iterations 轮、每轮按 color 扫一遍 → finalize。调三个旋钮看嵌套怎么展开；hover 任一色块看它对应 TinyVBD 原书的哪个方法。这把最易混的三层循环层级钉死。");
    root.appendChild(cap);
    window.addEventListener("themechange", draw);
    layout(); draw();
  };
})();
