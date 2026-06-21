/* hessian-spd-guard — 单顶点 3×3 局部 Hessian 的特征值条 + det 阈值守卫。
   左：可拖端点的单弹簧（控制压缩比 l/l0）。右：三根特征值条——惯性底 m/h²（恒正，绿）叠加
   弹簧块（沿向 +k、两垂直向 k(1-l0/l)）。压到 l<l0 → 垂直特征值变负；叠惯性看是否仍 ≥0（理由一），
   压过头使 det→0 触发 "SKIP this vertex"（理由二）。Knobs：压缩比、k(100 vs 1e8)、h。 */
(function () {
  window.VBWidgets["hessian-spd-guard"] = function (root) {
    const W = 560, H = 300; const c = (n) => VBW.c(n);
    const state = { ratio: 0.5, kExp: 2, hInv: 60 }; // l/l0, k=10^kExp, m/h²=hInv²
    const l0 = 1.0;

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function compute() {
      const k = Math.pow(10, state.kExp);
      const l = state.ratio * l0;
      const mh2 = state.hInv * state.hInv;        // 惯性底 m/h² (m=1)
      const lamPar = k;                            // 沿弹簧方向
      const lamPerp = k * (1 - l0 / l);            // 垂直方向（压缩 l<l0 → 负）
      // 合成特征值（惯性各向同性叠加）
      const e = [mh2 + lamPar, mh2 + lamPerp, mh2 + lamPerp];
      const det = e[0] * e[1] * e[2];
      const minEig = Math.min.apply(null, e);
      // det 阈值（演示用）：相对惯性底^3 太小则判退化跳过
      const skip = minEig <= 0 || det < Math.pow(mh2, 3) * 1e-6;
      return { k, l, mh2, lamPar, lamPerp, e, det, minEig, skip };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const r = compute();
      // 左：弹簧示意
      const sx = 30, sy = 80, slen = 140 * state.ratio;
      ctx.strokeStyle = c("ink-soft"); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + slen, sy); ctx.stroke();
      ctx.fillStyle = c("warn"); ctx.beginPath(); ctx.arc(sx, sy, 5, 0, 7); ctx.fill();
      ctx.fillStyle = c("accent") || "#6b5bd6"; ctx.beginPath(); ctx.arc(sx + slen, sy, 6, 0, 7); ctx.fill();
      // rest 长度参考
      ctx.strokeStyle = c("border"); ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, sy + 18); ctx.lineTo(sx + 140, sy + 18); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
      ctx.fillText("l₀ (rest)", sx + 100, sy + 32);
      ctx.fillText(state.ratio < 1 ? "压缩 l<l₀" : (state.ratio > 1 ? "拉伸 l>l₀" : "l=l₀"), sx, sy - 18);

      // 右：特征值条（log 尺度，带正负）
      const bx = 250, bw = W - bx - 30, by0 = 40, bh = 30, gap = 18;
      const labels = ["沿向 λ∥", "垂直 λ⊥ (a)", "垂直 λ⊥ (b)"];
      const zeroX = bx + 80;
      function lg(v) { const s = v >= 0 ? 1 : -1; return s * Math.log10(1 + Math.abs(v)); }
      const scale = 26;
      ctx.font = "11px var(--mono)";
      r.e.forEach((ev, i) => {
        const y = by0 + i * (bh + gap);
        ctx.fillStyle = c("ink-soft"); ctx.fillText(labels[i], bx - 4, y + bh / 2 + 4);
        const w = lg(ev) * scale;
        ctx.fillStyle = ev > 0 ? (c("interactive")) : "#e0463c";
        ctx.fillRect(zeroX, y, w, bh);
        ctx.fillStyle = c("ink"); ctx.fillText((ev >= 0 ? "+" : "") + ev.toExponential(1), zeroX + w + (w >= 0 ? 4 : -70), y + bh / 2 + 4);
      });
      // 零线
      ctx.strokeStyle = c("ink-faint"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(zeroX, by0 - 6); ctx.lineTo(zeroX, by0 + 3 * (bh + gap)); ctx.stroke();
      ctx.fillStyle = c("ink-faint"); ctx.fillText("0", zeroX - 4, by0 - 10);

      // 读数 + 守卫
      const yb = 210; ctx.font = "12px var(--mono)";
      ctx.fillStyle = c("ink-soft");
      ctx.fillText("惯性底 m/h² = " + r.mh2.toLocaleString(), 30, yb);
      ctx.fillText("弹簧 k = " + r.k.toExponential(0) + "   λ⊥(裸) = k(1-l₀/l) = " + r.lamPerp.toExponential(1), 30, yb + 20);
      ctx.fillText("min 特征值 = " + r.minEig.toExponential(1), 30, yb + 40);
      // 守卫牌
      ctx.font = "bold 14px var(--mono)";
      if (r.skip) { ctx.fillStyle = "#e0463c"; ctx.fillText("⚠ det→0 / 不定 → SKIP this vertex（理由二兜底）", 30, yb + 66); }
      else if (r.lamPerp < 0) { ctx.fillStyle = c("warn"); ctx.fillText("✓ 裸 Hessian 不定，但惯性底抬回正定（理由一）", 30, yb + 66); }
      else { ctx.fillStyle = c("interactive"); ctx.fillText("✓ 正定，直接可解", 30, yb + 66); }
    }

    const r1 = VBW.row();
    r1.appendChild(VBW.slider("压缩比 l/l₀", 0.3, 2, 0.05, state.ratio, (v) => { state.ratio = v; draw(); }, (v) => v.toFixed(2)).wrap);
    r1.appendChild(VBW.slider("弹簧刚度 k", 1, 8, 1, state.kExp, (v) => { state.kExp = v; draw(); }, (v) => "1e" + (v | 0)).wrap);
    r1.appendChild(VBW.slider("1/h", 20, 120, 10, state.hInv, (v) => { state.hInv = v; draw(); }, (v) => "h=1/" + (v | 0)).wrap);
    root.appendChild(cv); root.appendChild(r1);
    const cap = VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "拖压缩比把弹簧压到 l<l₀：垂直特征值（裸）变负、条变红。再看叠上惯性底 m/h² 后——软弹簧(k=1e2)被抬回正定（理由一）；硬弹簧(k=1e8)惯性底救不回 → det→0 触发 SKIP（理由二）。调 1/h 改惯性底高度看它何时还兜得住。");
    root.appendChild(cap);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
