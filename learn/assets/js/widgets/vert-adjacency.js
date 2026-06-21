/* vert-adjacency — 4-1 的 vertAdjacentEdges：约束图"按顶点转置"的可点图。
   一根 strand：结构边（相邻顶点）+ skip 边（i,i+2）。点任一顶点高亮它的 vertAdjacentEdges
   （结构边一色、skip 边另一色），侧栏列出 edgeId 列表。开/关 skip-spring 看邻接从 2 条/顶点升到最多 4 条。 */
(function () {
  window.VBWidgets["vert-adjacency"] = function (root) {
    const W = 560, H = 260; const c = (n) => VBW.c(n);
    const state = { N: 6, skip: true, sel: 2 };

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px;cursor:pointer";

    function edges() {
      const E = [];
      for (let i = 0; i < state.N - 1; i++) E.push({ a: i, b: i + 1, skip: false });   // 结构边
      if (state.skip) for (let i = 0; i < state.N - 2; i++) E.push({ a: i, b: i + 2, skip: true }); // skip 边
      return E;
    }
    function vx(i) { return 50 + i * ((W - 100) / (state.N - 1)); }
    const vy = 150;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const E = edges();
      const adj = E.map((e, id) => ({ ...e, id })).filter((e) => e.a === state.sel || e.b === state.sel);
      const adjIds = new Set(adj.map((e) => e.id));
      // 画边
      E.forEach((e, id) => {
        const on = adjIds.has(id);
        const x1 = vx(e.a), x2 = vx(e.b);
        ctx.strokeStyle = on ? (e.skip ? (c("warn")) : c("interactive")) : c("border");
        ctx.lineWidth = on ? 3 : 1.4;
        if (e.skip) { // skip 边画上弧
          ctx.beginPath(); ctx.moveTo(x1, vy); ctx.quadraticCurveTo((x1 + x2) / 2, vy - 60, x2, vy); ctx.stroke();
        } else { ctx.beginPath(); ctx.moveTo(x1, vy); ctx.lineTo(x2, vy); ctx.stroke(); }
      });
      // 顶点
      for (let i = 0; i < state.N; i++) {
        ctx.fillStyle = i === state.sel ? (c("accent") || "#6b5bd6") : c("ink-soft");
        ctx.beginPath(); ctx.arc(vx(i), vy, i === state.sel ? 9 : 6, 0, 7); ctx.fill();
        ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)"; ctx.fillText(String(i), vx(i) - 3, vy + 24);
      }
      // 标题 + 侧栏
      ctx.fillStyle = c("ink"); ctx.font = "13px var(--mono)";
      ctx.fillText("点顶点看它的 vertAdjacentEdges", 50, 34);
      ctx.font = "12px var(--mono)"; ctx.fillStyle = c("ink-soft");
      const ids = adj.map((e) => "e" + e.id + (e.skip ? "(skip)" : "")).join(", ");
      ctx.fillText("vertAdjacentEdges[" + state.sel + "] = { " + ids + " }", 50, 58);
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
      ctx.fillText("结构边" , 50, H - 18); ctx.fillStyle = c("interactive"); ctx.fillRect(94, H - 27, 12, 4);
      ctx.fillStyle = c("ink-faint"); ctx.fillText("skip 边", 130, H - 18); ctx.fillStyle = c("warn"); ctx.fillRect(176, H - 27, 12, 4);
      ctx.fillStyle = c("ink-faint"); ctx.fillText("→ 这正是 4.3 组装 f₂/H₂ 时遍历的 𝓕₂", 220, H - 18);
    }

    cv.addEventListener("click", (e) => {
      const rct = cv.getBoundingClientRect(); const mx = e.clientX - rct.left;
      let best = 0, bd = 1e9; for (let i = 0; i < state.N; i++) { const d = Math.abs(mx - vx(i)); if (d < bd) { bd = d; best = i; } }
      state.sel = best; draw();
    });
    const r1 = VBW.row();
    r1.appendChild(VBW.slider("顶点数 N", 4, 9, 1, state.N, (v) => { state.N = v | 0; if (state.sel >= state.N) state.sel = state.N - 1; draw(); }).wrap);
    r1.appendChild(VBW.toggle("skip-spring", state.skip, (v) => { state.skip = v; draw(); }));
    root.appendChild(cv); root.appendChild(r1);
    const cap = VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "点任一顶点：高亮它在 vertAdjacentEdges 里的边——青色结构边、琥珀 skip 边。关掉 skip-spring，每个内部顶点的邻接从 4 条降回 2 条。选中顶点 2 看到的那组边，正是 4.3 给它组装 f₂/H₂ 时要遍历的 force element 集合 𝓕₂。");
    root.appendChild(cap);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
