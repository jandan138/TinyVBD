/* substep-iteration-grid — substep × iteration 预算分配热力图。
   同样的总 solve 预算(substeps×iter)，分给更多 substep（稳）还是更多 iter（收敛干净）效果不同。
   格子颜色编码一根 strand 在该预算下的末态质量（残差/欠收敛偏软）。点格子看对应配置。
   Knobs：总预算上限、时间步 h、末端质量比。 */
(function () {
  window.VBWidgets["substep-iteration-grid"] = function (root) {
    const W = 560, H = 320; const c = (n) => VBW.c(n);
    const state = { budget: 200, hInv: 60, massRatio: 1 };
    const subs = [1, 2, 4, 8, 16], iters = [10, 25, 50, 100, 200];
    let sel = { si: 2, ii: 2 };

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px;cursor:pointer";

    // 启发式"末态质量"评分（0 差 → 1 好）：稳定性随 substep 升、收敛随 iter 升、贵随两者乘积升、质量比加难度
    function score(s, it) {
      const stiffStability = 1 - Math.exp(-s * (state.hInv / 60) / (1 + Math.log10(state.massRatio + 1))); // substep 多→惯性碗陡→稳
      const converge = 1 - Math.exp(-it / (60 * (1 + Math.log10(state.massRatio + 1))));                    // iter 多→收敛干净
      return VBW.clamp(0.5 * stiffStability + 0.5 * converge, 0, 1);
    }
    function cost(s, it) { return s * it; }

    const gx0 = 70, gy0 = 50, cw = 78, ch = 42;
    function cellRect(si, ii) { return { x: gx0 + si * cw, y: gy0 + ii * ch, w: cw - 4, h: ch - 4 }; }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.font = "11px var(--mono)"; ctx.fillStyle = c("ink-faint");
      ctx.fillText("substeps →", gx0, gy0 - 18); ctx.save(); ctx.translate(22, gy0 + 2.5 * ch); ctx.rotate(-Math.PI / 2); ctx.fillText("numIterations →", -50, 0); ctx.restore();
      subs.forEach((s, si) => { ctx.fillStyle = c("ink-soft"); ctx.fillText(String(s), gx0 + si * cw + 28, gy0 - 4); });
      iters.forEach((it, ii) => { ctx.fillStyle = c("ink-soft"); ctx.fillText(String(it), gx0 - 36, gy0 + ii * ch + 26); });

      subs.forEach((s, si) => iters.forEach((it, ii) => {
        const rc = cellRect(si, ii); const overBudget = cost(s, it) > state.budget;
        const q = score(s, it);
        // 颜色：质量低→红，质量高→teal；超预算→灰阴影
        const col = overBudget ? "rgba(120,120,120,.18)" : `hsl(${Math.round(q * 150)},60%,${55 - q * 8}%)`;
        ctx.fillStyle = col; ctx.fillRect(rc.x, rc.y, rc.w, rc.h);
        if (!overBudget) { ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "10px var(--mono)"; ctx.fillText(q.toFixed(2), rc.x + rc.w / 2 - 12, rc.y + rc.h / 2 + 3); }
        if (si === sel.si && ii === sel.ii) { ctx.strokeStyle = c("ink"); ctx.lineWidth = 2.5; ctx.strokeRect(rc.x, rc.y, rc.w, rc.h); }
      }));

      // 选中格读数
      const s = subs[sel.si], it = iters[sel.ii], q = score(s, it), co = cost(s, it);
      const yb = gy0 + 5 * ch + 24;
      ctx.font = "12px var(--mono)"; ctx.fillStyle = c("ink");
      ctx.fillText(`选中：substeps=${s} × iter=${it}  ⇒  每帧 ${co} 次 solve`, gx0 - 40, yb);
      ctx.fillStyle = co > state.budget ? "#e0463c" : c("ink-soft");
      ctx.fillText(co > state.budget ? `超出预算 ${state.budget}（灰格）` : `预算内（上限 ${state.budget}）· 末态质量 ${q.toFixed(2)}`, gx0 - 40, yb + 20);
      ctx.fillStyle = c("ink-faint");
      ctx.fillText(`惯性碗系数 m/h'² ∝ substeps² → 此配置陡 ${s * s}×（vs substeps=1）`, gx0 - 40, yb + 40);
    }

    cv.addEventListener("click", (e) => {
      const rct = cv.getBoundingClientRect(); const mx = e.clientX - rct.left, my = e.clientY - rct.top;
      subs.forEach((s, si) => iters.forEach((it, ii) => { const rc = cellRect(si, ii); if (mx >= rc.x && mx <= rc.x + rc.w && my >= rc.y && my <= rc.y + rc.h) { sel = { si, ii }; draw(); } }));
    });
    const r1 = VBW.row();
    r1.appendChild(VBW.slider("总预算 (solve/帧)", 50, 800, 50, state.budget, (v) => { state.budget = v; draw(); }, (v) => v | 0).wrap);
    r1.appendChild(VBW.slider("1/h", 30, 120, 10, state.hInv, (v) => { state.hInv = v; draw(); }, (v) => "h=1/" + (v | 0)).wrap);
    r1.appendChild(VBW.slider("末端质量比", 1, 1000, 1, state.massRatio, (v) => { state.massRatio = v; draw(); }, (v) => "1:" + (v | 0)).wrap);
    root.appendChild(cv); root.appendChild(r1);
    const cap = VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "点格子：每格是一种 substeps×iter 配置，颜色=末态质量（teal 好/红差），数字=评分；灰格超出每帧预算。同样预算下，质量比越高越要把预算往 substep 倾（稳），低质量比则 iter 更划算（收敛干净）。注意 m/h'² ∝ substeps²——substep 翻倍惯性碗陡 4×。");
    root.appendChild(cap);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
