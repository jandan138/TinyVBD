/* pd-local-global — Projective Dynamics 的 local/global 交替演示。
   一根 2D 弹簧链：local 步把每条边各自归一化到 l0（得理想片段 p_i，断开、对不齐）；
   global 步把所有顶点拉回一个协调位形（最小化 Σ‖(x_a-x_b)-p_i‖²，端点固定）。
   下方画 G 随交替轮次单调下降。单步 local / global / 自动。global 矩阵恒定（预分解）→ 徽标提示。 */
(function () {
  window.VBWidgets["pd-local-global"] = function (root) {
    const W = 560, H = 340; const c = (n) => VBW.c(n);
    const state = { N: 6, w: 1.0, phase: "idle", round: 0, auto: false };
    let X = [], P = [], Ghist = []; const L0 = 1.0;
    const padX = 40, baseY = 90, span = () => (W - 2 * padX);

    function init() {
      X = []; for (let i = 0; i < state.N; i++) X.push({ x: padX + (i / (state.N - 1)) * span(), y: baseY });
      // 扰动中间顶点，制造不协调初值
      for (let i = 1; i < state.N - 1; i++) X[i].y = baseY + (i % 2 ? 38 : -30) * (1 - Math.abs(i - state.N / 2) / state.N);
      P = X.slice(0, state.N - 1).map(() => ({ dx: 0, dy: 0 }));
      Ghist = [energy()]; state.round = 0; state.phase = "idle";
    }
    function restLen() { return span() / (state.N - 1) * 0.62; } // 像素下的"静止长度"，让形变可见
    function energy() {
      let g = 0; const rl = restLen();
      for (let i = 0; i < state.N - 1; i++) {
        const dx = X[i + 1].x - X[i].x, dy = X[i + 1].y - X[i].y;
        const l = Math.hypot(dx, dy); g += 0.5 * state.w * (l - rl) * (l - rl);
      }
      return g;
    }
    // local：每条边投影到理想长度方向
    function localStep() {
      const rl = restLen();
      for (let i = 0; i < state.N - 1; i++) {
        let dx = X[i + 1].x - X[i].x, dy = X[i + 1].y - X[i].y;
        const l = Math.hypot(dx, dy) || 1e-6;
        P[i].dx = dx / l * rl; P[i].dy = dy / l * rl;   // 理想边向量 p_i
      }
    }
    // global：固定两端，用 Jacobi 迭代逼近"让真实边贴近 p_i"的协调解（演示用，足够单调）
    function globalStep() {
      for (let it = 0; it < 40; it++) {
        const nx = X.map((p) => ({ x: p.x, y: p.y }));
        for (let i = 1; i < state.N - 1; i++) {
          // 目标：x[i] 使 (x[i]-x[i-1])≈p[i-1] 且 (x[i+1]-x[i])≈p[i]
          const tx = 0.5 * ((X[i - 1].x + P[i - 1].dx) + (X[i + 1].x - P[i].dx));
          const ty = 0.5 * ((X[i - 1].y + P[i - 1].dy) + (X[i + 1].y - P[i].dy));
          nx[i].x = tx; nx[i].y = ty;
        }
        X = nx;
      }
    }

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // 当前链
      ctx.strokeStyle = c("ink-soft"); ctx.lineWidth = 2; ctx.beginPath();
      X.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      // local 理想片段（断开的虚线段，挂在每条边中点）
      if (state.phase === "local" || state.phase === "after-local") {
        ctx.strokeStyle = c("interactive"); ctx.lineWidth = 2.5; ctx.setLineDash([5, 3]);
        for (let i = 0; i < state.N - 1; i++) {
          const mx = (X[i].x + X[i + 1].x) / 2, my = (X[i].y + X[i + 1].y) / 2;
          ctx.beginPath(); ctx.moveTo(mx - P[i].dx / 2, my - P[i].dy / 2); ctx.lineTo(mx + P[i].dx / 2, my + P[i].dy / 2); ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      X.forEach((p, i) => { ctx.fillStyle = (i === 0 || i === state.N - 1) ? c("warn") : c("accent") || "#6b5bd6"; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 7); ctx.fill(); });
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
      ctx.fillText("端点固定", X[0].x - 10, X[0].y - 12);

      // G 折线
      const gx0 = padX, gy0 = 200, gw = W - 2 * padX, gh = 110;
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx0, gy0); ctx.lineTo(gx0, gy0 + gh); ctx.lineTo(gx0 + gw, gy0 + gh); ctx.stroke();
      ctx.fillStyle = c("ink-faint"); ctx.fillText("G (能量)", gx0, gy0 - 6); ctx.fillText("local/global 轮次 →", gx0 + gw - 150, gy0 + gh + 18);
      if (Ghist.length) {
        const gmax = Math.max.apply(null, Ghist) || 1;
        ctx.strokeStyle = c("interactive"); ctx.lineWidth = 2; ctx.beginPath();
        Ghist.forEach((g, i) => { const x = gx0 + (i / Math.max(1, Ghist.length - 1)) * gw, y = gy0 + gh - (g / gmax) * gh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
        Ghist.forEach((g, i) => { const x = gx0 + (i / Math.max(1, Ghist.length - 1)) * gw, y = gy0 + gh - (g / gmax) * gh; ctx.fillStyle = c("interactive"); ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); });
      }
      // global 恒定矩阵徽标
      ctx.fillStyle = c("tv") || c("interactive"); ctx.font = "11px var(--mono)";
      ctx.fillText("⚙ global 矩阵恒定 · 预分解一次", gx0 + gw - 220, gy0 + 14);
      // 阶段标
      ctx.fillStyle = c("ink"); ctx.font = "13px var(--mono)";
      ctx.fillText("轮次 " + state.round + " · " + (state.phase === "idle" ? "待开始" : state.phase), gx0, 22);
    }

    function doLocal() { localStep(); state.phase = "after-local"; draw(); }
    function doGlobal() { globalStep(); state.round++; Ghist.push(energy()); state.phase = "after-global"; draw(); }
    let lastT = 0;
    function tick(ts) { if (!state.auto) return; if (ts - lastT > 700) { if (state.phase === "after-local") doGlobal(); else doLocal(); lastT = ts; } requestAnimationFrame(tick); }

    const r1 = VBW.row();
    r1.appendChild(VBW.slider("顶点数 N", 4, 9, 1, state.N, (v) => { state.N = v | 0; init(); draw(); }).wrap);
    r1.appendChild(VBW.slider("刚度权重 w", 0.2, 3, 0.1, state.w, (v) => { state.w = v; Ghist = [energy()]; draw(); }, (v) => v.toFixed(1)).wrap);
    const r2 = VBW.row();
    const mk = (t, f) => { const b = VBW.el("button", null, t); b.style.cssText = "margin-right:8px;padding:6px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--ink);cursor:pointer;font:13px var(--mono)"; b.addEventListener("click", f); return b; };
    r2.appendChild(mk("local 步", doLocal));
    r2.appendChild(mk("global 步", doGlobal));
    const bA = mk("自动", () => { state.auto = !state.auto; bA.textContent = state.auto ? "暂停" : "自动"; if (state.auto) requestAnimationFrame(tick); });
    r2.appendChild(bA);
    r2.appendChild(mk("重置", () => { state.auto = false; bA.textContent = "自动"; init(); draw(); }));

    root.appendChild(cv); root.appendChild(r1); root.appendChild(r2);
    const cap = VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "单步「local」：每条边各自归一化到理想长度（青虚线段，断开、对不齐）；单步「global」：固定两端把顶点拼回协调位形。反复交替，下方 G 单调下降。global 用的矩阵恒定、只需预分解一次——这正是 PD 快的原因。");
    root.appendChild(cap);
    window.addEventListener("themechange", draw);
    init(); draw();
  };
})();
