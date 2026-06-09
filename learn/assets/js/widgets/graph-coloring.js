/* graph-coloring — 在一块 2D 三角网格上做顶点着色(primal) vs 约束/边着色(dual)，
   数出各自的颜色数，直观说明：顶点图的颜色远少于约束图 → 更多并行。 */
(function () {
  // greedy graph coloring: adj is array of neighbor-index arrays. returns Int32Array of colors.
  function greedyColor(adj) {
    const n = adj.length, color = new Int32Array(n).fill(-1);
    for (let v = 0; v < n; v++) {
      const used = new Set();
      for (const o of adj[v]) if (color[o] >= 0) used.add(color[o]);
      let cc = 0; while (used.has(cc)) cc++;
      color[v] = cc;
    }
    return color;
  }

  // build primal (vertex) and dual (edge/constraint) adjacency for a cols×rows triangle mesh.
  function buildMeshGraphs(cols, rows) {
    const idx = (r, c) => r * cols + c;
    const n = cols * rows;
    const edges = [];
    const vertAdjSet = Array.from({ length: n }, () => new Set());
    const addE = (a, b) => { edges.push([a, b]); vertAdjSet[a].add(b); vertAdjSet[b].add(a); };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = idx(r, c);
      if (c + 1 < cols) addE(i, idx(r, c + 1));
      if (r + 1 < rows) addE(i, idx(r + 1, c));
      if (c + 1 < cols && r + 1 < rows) addE(i, idx(r + 1, c + 1));
    }
    const vertAdj = vertAdjSet.map((s) => [...s]);
    // dual: two edges are adjacent if they share a vertex
    const edgesOfVert = Array.from({ length: n }, () => []);
    edges.forEach(([a, b], ei) => { edgesOfVert[a].push(ei); edgesOfVert[b].push(ei); });
    const edgeAdjSet = Array.from({ length: edges.length }, () => new Set());
    for (let v = 0; v < n; v++) {
      const es = edgesOfVert[v];
      for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
        edgeAdjSet[es[i]].add(es[j]); edgeAdjSet[es[j]].add(es[i]);
      }
    }
    const edgeAdj = edgeAdjSet.map((s) => [...s]);
    return { edges, vertAdj, edgeAdj };
  }

  window.VBW = window.VBW || {};
  window.VBW.greedyColor = greedyColor;
  window.VBW.buildMeshGraphs = buildMeshGraphs;

  window.VBWidgets = window.VBWidgets || {};
  window.VBWidgets["graph-coloring"] = function (root) {
    const W = 560, H = 320, cols = 8, rows = 6, s = 60, x0 = 60, y0 = 40;
    const c = (n) => VBW.c(n);
    const { edges, vertAdj, edgeAdj } = buildMeshGraphs(cols, rows);
    const vColor = greedyColor(vertAdj), eColor = greedyColor(edgeAdj);
    const nV = Math.max(...vColor) + 1, nE = Math.max(...eColor) + 1;
    const palette = ["#0e7490", "#9333ea", "#c2660a", "#2563eb", "#dc2626", "#16a34a", "#db2777", "#0891b2", "#7c3aed", "#ea580c"];
    let mode = "primal";
    const P = (i) => ({ x: x0 + (i % cols) * s, y: y0 + Math.floor(i / cols) * s });

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1.5;
      edges.forEach(([a, b], ei) => {
        ctx.strokeStyle = mode === "dual" ? palette[eColor[ei] % palette.length] : c("border-strong");
        const pa = P(a), pb = P(b);
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      });
      for (let i = 0; i < cols * rows; i++) {
        const p = P(i);
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = mode === "primal" ? palette[vColor[i] % palette.length] : c("ink-faint");
        ctx.fill();
      }
    }
    const cap = VBW.el("div", { class: "lab-cap" });
    function updateCap() {
      cap.innerHTML = mode === "primal"
        ? "顶点图(primal)：<b>" + nV + "</b> colors —— 同色顶点可并行更新。"
        : "约束图(dual)：<b>" + nE + "</b> colors —— 约束更多、连接更密，颜色更多。";
    }
    const seg = VBW.seg(
      [{ label: "顶点 primal", value: "primal" }, { label: "约束 dual", value: "dual" }],
      mode, (v) => { mode = v; draw(); updateCap(); });
    root.appendChild(cv); root.appendChild(seg); root.appendChild(cap);
    draw(); updateCap();
  };
})();
