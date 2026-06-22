/* newmark-ringing — Newmark-β 在一根线性弹簧振子 ẍ=-ω²x 上，调 γ 从 ½→1：
   γ=½ (β=¼) 是 trapezoidal（二阶、无数值阻尼 → 振幅守恒、会"振铃"持续抖）；
   γ=1 (β=½) 退回 backward Euler（一阶、强数值阻尼 → 振幅被压住）。
   中间是连续过渡谱。画振幅包络随时间衰/不衰，直观看到"无阻尼=振铃"的代价。 */
(function () {
  window.VBWidgets["newmark-ringing"] = function (root) {
    const W = 560, H = 280, PAD = 36; const c = (n) => VBW.c(n);
    const st = { gamma: 0.5, omega2: 60, dt: 0.035, steps: 120 };

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    // β 与 γ 联动：γ=0.5→β=0.25 (trapezoidal)，γ=1.0→β=0.5 (backward Euler)，线性过渡
    function betaOf(g) { return 0.25 + 0.5 * (g - 0.5); }

    function integrate(gamma) {
      const h = st.dt, w2 = st.omega2, beta = betaOf(gamma);
      let x = 1, v = 0, a = -w2 * x;          // a = f/m = -ω²x
      const arr = [x];
      for (let i = 0; i < st.steps; i++) {
        // x_{n+1} = [x + h v + h²(½-β)a] / (1 + β h² ω²)
        const xn = (x + h * v + h * h * (0.5 - beta) * a) / (1 + beta * h * h * w2);
        const an = -w2 * xn;                  // a_{n+1}
        const vn = v + h * ((1 - gamma) * a + gamma * an);
        x = xn; v = vn; a = an;
        arr.push(x);
        if (!isFinite(x) || Math.abs(x) > 1e6) { while (arr.length <= st.steps) arr.push(NaN); break; }
      }
      return arr;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const X = (i) => PAD + i / st.steps * (W - 2 * PAD);
      const Y = (x) => H / 2 - x * (H / 2 - PAD) / 1.25;
      // 轴 + 初始振幅参考线（±1）
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, H / 2); ctx.lineTo(W - PAD, H / 2); ctx.stroke();
      ctx.strokeStyle = c("ink-faint"); ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, Y(1)); ctx.lineTo(W - PAD, Y(1)); ctx.moveTo(PAD, Y(-1)); ctx.lineTo(W - PAD, Y(-1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = c("ink-faint"); ctx.font = "10px var(--mono)"; ctx.fillText("初始振幅", PAD + 2, Y(1) - 4);

      // 当前 γ 的曲线（主）
      const arr = integrate(st.gamma);
      ctx.strokeStyle = c("interactive"); ctx.lineWidth = 2; ctx.beginPath();
      let started = false;
      for (let i = 0; i < arr.length; i++) {
        if (!isFinite(arr[i])) break;
        const yy = Y(arr[i]); started ? ctx.lineTo(X(i), yy) : ctx.moveTo(X(i), yy); started = true;
      }
      ctx.stroke();

      // 淡淡叠一条 backward Euler (γ=1) 作对照
      if (st.gamma < 0.99) {
        const ref = integrate(1.0);
        ctx.strokeStyle = c("ink-faint"); ctx.globalAlpha = 0.55; ctx.lineWidth = 1.3; ctx.setLineDash([2, 3]); ctx.beginPath();
        let s2 = false;
        for (let i = 0; i < ref.length; i++) { if (!isFinite(ref[i])) break; const yy = Y(ref[i]); s2 ? ctx.lineTo(X(i), yy) : ctx.moveTo(X(i), yy); s2 = true; }
        ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      }

      // 末端振幅，量化衰减
      const last = arr.filter((v) => isFinite(v)).slice(-20);
      const env = last.length ? Math.max.apply(null, last.map(Math.abs)) : 0;

      // 标注
      const beta = betaOf(st.gamma);
      const label = st.gamma <= 0.505 ? "γ=½, β=¼ → trapezoidal（二阶，无阻尼）"
                  : st.gamma >= 0.995 ? "γ=1, β=½ → backward Euler（一阶，强阻尼）"
                  : "γ=" + st.gamma.toFixed(2) + ", β=" + beta.toFixed(2) + " → 介于两者之间";
      ctx.fillStyle = c("ink"); ctx.font = "13px var(--mono)"; ctx.fillText(label, PAD, 20);
      ctx.fillStyle = env > 0.85 ? "#c98a2b" : c("interactive"); ctx.font = "11px var(--mono)";
      ctx.fillText("末端振幅 ≈ " + env.toFixed(2) + (env > 0.85 ? "（几乎不衰减 → 振铃）" : "（被阻尼压小 → 稳）"), PAD, H - 12);
      ctx.fillStyle = c("ink-faint"); ctx.fillText("虚线=backward Euler 对照", W - 180, H - 12);
    }

    const r1 = VBW.row();
    r1.appendChild(VBW.slider("γ （½=trapezoidal · 1=backward Euler）", 0.5, 1.0, 0.05, st.gamma, (v) => { st.gamma = v; draw(); }, (v) => v.toFixed(2)).wrap);
    const r2 = VBW.row();
    r2.appendChild(VBW.slider("刚度 ω²", 30, 200, 10, st.omega2, (v) => { st.omega2 = v; draw(); }).wrap);
    r2.appendChild(VBW.slider("时间步 dt", 0.02, 0.06, 0.0025, st.dt, (v) => { st.dt = v; draw(); }, (v) => v.toFixed(3)).wrap);
    root.appendChild(cv); root.appendChild(r1); root.appendChild(r2);
    root.appendChild(VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "同一根弹簧振子，调 γ：γ=½ 是 trapezoidal——二阶更准、能量守恒，但振幅永不衰减（高频一直抖，这就是『振铃』）；把 γ 推到 1 就连续退回 backward Euler——一阶、但数值阻尼把振幅稳稳压住。这正是 1.1 那个『放大倍数 G』的现场：trapezoidal 的 G=1（守恒），backward Euler 的 G<1（压高频）。物理引擎宁可要后者的『稳』。"));
    window.addEventListener("themechange", draw);
    draw();
  };
})();
