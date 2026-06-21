/* strain-energy-models — 超弹性能量 ψ vs 单轴拉伸比 λ：StVK / co-rotational / Neo-Hookean 对照。
   高亮 StVK 在压缩区(λ<1)的反转灾难：能量过了某点反而下降 → 单元被压穿不回弹。
   Neo-Hookean 的 ln J 项在 λ→0 发散 → 抗反转。调 μ/λ(Lamé)。 */
(function () {
  window.VBWidgets["strain-energy-models"] = function (root) {
    const W = 560, H = 300, PAD = 44; const c = (n) => VBW.c(n);
    const st = { mu: 1.0, lam: 1.0, show: { stvk: true, coro: true, nh: true } };
    // 单轴：F=diag(λ, 1)（2D），用各模型能量密度（示意，统一量纲）
    function psiStVK(l) { const E1 = 0.5 * (l * l - 1), E2 = 0; const trE = E1 + E2; return st.mu * (E1 * E1 + E2 * E2) + 0.5 * st.lam * trE * trE; }
    function psiCoro(l) { const s1 = l - 1, s2 = 0; const tr = s1 + s2; return st.mu * (s1 * s1 + s2 * s2) + 0.5 * st.lam * tr * tr; }
    function psiNH(l) { if (l <= 1e-3) return Infinity; const J = l * 1, I1 = l * l + 1; const lnJ = Math.log(J); return 0.5 * st.mu * (I1 - 2) - st.mu * lnJ + 0.5 * st.lam * lnJ * lnJ; }

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const lmin = 0.2, lmax = 2.2;
      const samp = (fn) => { const a = []; for (let i = 0; i <= 200; i++) { const l = lmin + (i / 200) * (lmax - lmin); let v = fn(l); a.push([l, v]); } return a; };
      const series = [];
      if (st.show.stvk) series.push(["StVK", samp(psiStVK), c("pbd") || "#c98a2b"]);
      if (st.show.coro) series.push(["co-rotational", samp(psiCoro), c("accent") || "#6b5bd6"]);
      if (st.show.nh) series.push(["Neo-Hookean", samp(psiNH), c("interactive")]);
      let ymax = 0; series.forEach(([, s]) => s.forEach(([, v]) => { if (isFinite(v)) ymax = Math.max(ymax, v); }));
      ymax = Math.min(ymax, 6) || 1;
      const PX = (l) => PAD + (l - lmin) / (lmax - lmin) * (W - 2 * PAD);
      const PY = (v) => (H - PAD) - VBW.clamp(v / ymax, 0, 1) * (H - 2 * PAD);
      // 轴 + λ=1 线
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, PAD - 6); ctx.lineTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke();
      ctx.strokeStyle = c("ink-faint"); ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(PX(1), PAD - 6); ctx.lineTo(PX(1), H - PAD); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
      ctx.fillText("ψ (能量密度)", 6, PAD + 4); ctx.fillText("拉伸比 λ →", W - PAD - 70, H - PAD + 18);
      ctx.fillText("λ=1 (无形变)", PX(1) + 4, PAD + 6); ctx.fillText("压缩", PX(0.5), H - PAD + 16); ctx.fillText("拉伸", PX(1.8), H - PAD + 16);
      // 曲线
      let ly = PAD + 2;
      series.forEach(([name, s, col]) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath(); let started = false;
        s.forEach(([l, v]) => { if (!isFinite(v)) { started = false; return; } const x = PX(l), y = PY(v); started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true; });
        ctx.stroke();
        ctx.fillStyle = col; ctx.fillRect(W - 190, ly, 14, 3); ctx.fillStyle = c("ink-soft"); ctx.font = "11px var(--mono)"; ctx.fillText(name, W - 170, ly + 4); ly += 16;
      });
      // StVK 反转警告：在压缩区找峰值
      if (st.show.stvk) {
        const s = samp(psiStVK); let peak = 0, pl = 0; s.forEach(([l, v]) => { if (l < 1 && v > peak) { peak = v; pl = l; } });
        if (pl > lmin + 0.02) { ctx.fillStyle = "#e0463c"; ctx.font = "11px var(--mono)"; ctx.fillText("⚠ StVK 压缩区能量见顶后下降 → 反转灾难", PAD + 6, PAD + 8); ctx.beginPath(); ctx.arc(PX(pl), PY(peak), 4, 0, 7); ctx.fill(); }
      }
    }
    const r1 = VBW.row();
    r1.appendChild(VBW.slider("μ (剪切)", 0.2, 3, 0.1, st.mu, (v) => { st.mu = v; draw(); }, (v) => v.toFixed(1)).wrap);
    r1.appendChild(VBW.slider("λ (体积)", 0.0, 3, 0.1, st.lam, (v) => { st.lam = v; draw(); }, (v) => v.toFixed(1)).wrap);
    const r2 = VBW.row();
    r2.appendChild(VBW.toggle("StVK", st.show.stvk, (v) => { st.show.stvk = v; draw(); }));
    r2.appendChild(VBW.toggle("co-rotational", st.show.coro, (v) => { st.show.coro = v; draw(); }));
    r2.appendChild(VBW.toggle("Neo-Hookean", st.show.nh, (v) => { st.show.nh = v; draw(); }));
    root.appendChild(cv); root.appendChild(r1); root.appendChild(r2);
    root.appendChild(VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "能量应在 λ=1（无形变）处为 0、两侧上升。盯住压缩区 λ<1：StVK 的能量见顶后竟然下降——单元被压过头就再也回不来（反转灾难）；Neo-Hookean 的 ln J 项让 λ→0 时能量冲向无穷，天然抗反转。这就是 production 选 NH 不选 StVK 的原因。"));
    window.addEventListener("themechange", draw); draw();
  };
})();
