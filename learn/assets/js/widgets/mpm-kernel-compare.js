/* mpm-kernel-compare — linear / quadratic B-spline / compact(CK) 核对照：支撑宽度 + 每粒子触及的网格节点数。
   画一个粒子在网格中，高亮三种核各自覆盖的节点(1D stencil 宽度 2 / 3 / 紧支撑)，并报每粒子节点数(2D/3D)。
   直接服务 MPM Lite「线性核」与 CK-MPM「C² 紧核、约线性 2×」的卖点对照。 */
(function () {
  window.VBWidgets["mpm-kernel-compare"] = function (root) {
    const W = 560, H = 300; const c = (n) => VBW.c(n);
    const st = { kernel: "linear", dim: 2 };
    const gx0 = 70, gy0 = 60, cell = 60, NX = 7, NY = 4;
    const px = gx0 + 3.35 * cell, py = gy0 + 1.6 * cell; // 粒子位置（落在格内）

    // 1D 半支撑（节点数/维）：linear=2, quadratic B-spline=3, compact≈2(但 C²)
    const info = {
      linear:    { w1d: 2, label: "linear（MPM Lite 用）", note: "窄、便宜；但只有 C⁰，精度/稳定性较弱——MPM Lite 靠去粒子求积等手段补回来" },
      quadratic: { w1d: 3, label: "quadratic B-spline（经典 MPM）", note: "C¹、稳，但每粒子触及节点多、宽 stencil → 隐式解开销大" },
      compact:   { w1d: 2, label: "compact（CK-MPM）", note: "C² 连续却保持紧支撑：约线性核 2× 节点，远少于二次 B-spline" },
    };
    function perParticle(k, d) { const w = info[k].w1d; return Math.pow(k === "compact" ? w + 0.0 : w, d) | 0; }

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const w1d = info[st.kernel].w1d;
      const gi = Math.floor((px - gx0) / cell), gj = Math.floor((py - gy0) / cell);
      // 覆盖范围：从 gi-(w-1)/...，简化：linear→{gi,gi+1}; quad→{gi-1,gi,gi+1}; compact→{gi,gi+1} 但画成更平滑
      let iset, jset;
      if (st.kernel === "quadratic") { iset = [gi - 1, gi, gi + 1]; jset = [gj - 1, gj, gj + 1]; }
      else { iset = [gi, gi + 1]; jset = [gj, gj + 1]; }
      // 网格
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1;
      for (let i = 0; i < NX; i++) { ctx.beginPath(); ctx.moveTo(gx0 + i * cell, gy0); ctx.lineTo(gx0 + i * cell, gy0 + (NY - 1) * cell); ctx.stroke(); }
      for (let j = 0; j < NY; j++) { ctx.beginPath(); ctx.moveTo(gx0, gy0 + j * cell); ctx.lineTo(gx0 + (NX - 1) * cell, gy0 + j * cell); ctx.stroke(); }
      // 覆盖节点
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
        const cover = iset.includes(i) && jset.includes(j);
        ctx.fillStyle = cover ? (st.kernel === "compact" ? c("interactive") : st.kernel === "linear" ? (c("tv") || "#3bb3a8") : (c("pbd") || "#c98a2b")) : c("ink-faint");
        ctx.beginPath(); ctx.arc(gx0 + i * cell, gy0 + j * cell, cover ? 6 : 2.5, 0, 7); ctx.fill();
      }
      // 支撑范围框
      const x0 = gx0 + iset[0] * cell, y0 = gy0 + jset[0] * cell, x1 = gx0 + iset[iset.length - 1] * cell, y1 = gy0 + jset[jset.length - 1] * cell;
      ctx.strokeStyle = c("warn"); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.strokeRect(x0 - 8, y0 - 8, (x1 - x0) + 16, (y1 - y0) + 16); ctx.setLineDash([]);
      // 粒子
      ctx.fillStyle = "#e0463c"; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)"; ctx.fillText("粒子", px + 8, py - 8);
      // 读数
      ctx.fillStyle = c("ink"); ctx.font = "13px var(--mono)"; ctx.fillText(info[st.kernel].label, 20, 30);
      const pp = Math.pow(w1d, st.dim);
      ctx.fillStyle = c("ink-soft"); ctx.font = "12px var(--mono)";
      ctx.fillText("每粒子触及网格节点数（" + st.dim + "D）= " + w1d + "^" + st.dim + " = " + pp, 20, H - 40);
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
      let line = "", yy = H - 18; info[st.kernel].note.split("").forEach((ch) => { if (ctx.measureText(line + ch).width > W - 40) { ctx.fillText(line, 20, yy - 14); line = ch; } else line += ch; }); ctx.fillText(line, 20, yy);
    }
    const r1 = VBW.row();
    r1.appendChild(VBW.seg([{ label: "linear", value: "linear" }, { label: "quadratic", value: "quadratic" }, { label: "compact(CK)", value: "compact" }], st.kernel, (v) => { st.kernel = v; draw(); }));
    r1.appendChild(VBW.seg([{ label: "2D", value: 2 }, { label: "3D", value: 3 }], st.dim, (v) => { st.dim = v; draw(); }));
    root.appendChild(cv); root.appendChild(r1);
    root.appendChild(VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "切核看一个粒子覆盖多少网格节点：quadratic B-spline（经典）每维 3 个节点 → 3D 共 27 个，隐式解很贵；linear（MPM Lite）每维 2 个 → 8 个，便宜但只有 C⁰；compact(CK-MPM) 用 C² 连续的紧支撑核，节点数接近线性却光滑得多。节点数正比于隐式求解的 stencil 开销。"));
    window.addEventListener("themechange", draw); draw();
  };
})();
