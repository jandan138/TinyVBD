/* mpm-cycle — MPM 一步四段循环：P2G → grid solve → G2P → advect。
   背景网格 + 几个粒子。分步高亮当前阶段：P2G 时粒子→网格节点连线亮、网格节点点亮（scratch）；
   grid solve 时网格加重力箭头；G2P 时网格→粒子连线亮；advect 时粒子移动、网格熄灭(清零)。单步/自动。 */
(function () {
  window.VBWidgets["mpm-cycle"] = function (root) {
    const W = 560, H = 300; const c = (n) => VBW.c(n);
    const stages = ["P2G（粒子→网格）", "grid solve（网格上加力、更新网格速度）", "G2P（网格→粒子）", "advect（粒子移动、更新 F）"];
    const st = { stage: 0, auto: false };
    const gx0 = 60, gy0 = 40, cell = 56, NX = 7, NY = 4;   // 网格
    let parts = [{ x: 150, y: 120 }, { x: 250, y: 170 }, { x: 330, y: 110 }, { x: 210, y: 90 }];
    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function nodes(p) { // 粒子邻近的网格节点（最近 2×2）
      const gi = Math.floor((p.x - gx0) / cell), gj = Math.floor((p.y - gy0) / cell);
      const out = [];
      for (let i = gi; i <= gi + 1; i++) for (let j = gj; j <= gj + 1; j++) if (i >= 0 && i < NX && j >= 0 && j < NY) out.push([gx0 + i * cell, gy0 + j * cell]);
      return out;
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const active = st.stage === 0 || st.stage === 1 || st.stage === 2; // 网格在用
      // 网格线
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1;
      for (let i = 0; i < NX; i++) { ctx.beginPath(); ctx.moveTo(gx0 + i * cell, gy0); ctx.lineTo(gx0 + i * cell, gy0 + (NY - 1) * cell); ctx.stroke(); }
      for (let j = 0; j < NY; j++) { ctx.beginPath(); ctx.moveTo(gx0, gy0 + j * cell); ctx.lineTo(gx0 + (NX - 1) * cell, gy0 + j * cell); ctx.stroke(); }
      // 粒子↔网格连线 + 节点
      const litNodes = new Set();
      parts.forEach((p) => nodes(p).forEach((n) => {
        if (st.stage === 0 || st.stage === 2) { ctx.strokeStyle = (st.stage === 0 ? c("interactive") : c("accent") || "#6b5bd6") + "88"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n[0], n[1]); ctx.stroke(); }
        litNodes.add(n[0] + "," + n[1]);
      }));
      // 网格节点
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
        const key = (gx0 + i * cell) + "," + (gy0 + j * cell); const lit = active && litNodes.has(key);
        ctx.fillStyle = lit ? c("warn") : c("ink-faint"); ctx.beginPath(); ctx.arc(gx0 + i * cell, gy0 + j * cell, lit ? 4 : 2, 0, 7); ctx.fill();
        if (st.stage === 1 && lit) { ctx.strokeStyle = c("warn"); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx0 + i * cell, gy0 + j * cell); ctx.lineTo(gx0 + i * cell, gy0 + j * cell + 14); ctx.stroke(); }
      }
      // 粒子
      parts.forEach((p) => { ctx.fillStyle = c("interactive"); ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 7); ctx.fill(); });
      // 阶段标
      ctx.fillStyle = c("ink"); ctx.font = "13px var(--mono)"; ctx.fillText("阶段 " + (st.stage + 1) + "/4 · " + stages[st.stage], 20, H - 38);
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
      ctx.fillText(active ? "网格在用（scratch）" : "网格已清零——粒子携带状态走到下一步", 20, H - 18);
    }
    function step() {
      if (st.stage === 3) parts = parts.map((p) => ({ x: VBW.clamp(p.x + 22, gx0 + 6, gx0 + (NX - 1) * cell - 6), y: p.y + 6 }));
      st.stage = (st.stage + 1) % 4; draw();
    }
    let lastT = 0; function tick(t) { if (!st.auto) return; if (t - lastT > 900) { step(); lastT = t; } requestAnimationFrame(tick); }
    const r1 = VBW.row();
    const mk = (t, f) => { const b = VBW.el("button", null, t); b.style.cssText = "margin-right:8px;padding:6px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--ink);cursor:pointer;font:13px var(--mono)"; b.addEventListener("click", f); return b; };
    r1.appendChild(mk("下一阶段 ▶", step));
    const bA = mk("自动", () => { st.auto = !st.auto; bA.textContent = st.auto ? "暂停" : "自动"; if (st.auto) requestAnimationFrame(tick); }); r1.appendChild(bA);
    root.appendChild(cv); root.appendChild(r1);
    root.appendChild(VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "单步走 MPM 一帧的四段：P2G 把粒子的质量/动量散布到邻近网格节点（亮）→ grid solve 在网格上加重力/内力、更新网格速度 → G2P 粒子收回新速度 → advect 粒子移动并更新 F，网格清零。粒子永久携带状态（Lagrangian），网格只是借来算力的 scratch（Eulerian）。"));
    window.addEventListener("themechange", draw); draw();
  };
})();
