/* hessian-spd-guard — 单顶点 3×3 局部 Hessian 的谱与 determinant 诊断。
   widget key 为兼容现有页面保留。谱用 minEig > 0 判断 SPD；determinant 独立模拟 Newton/Warp 的
   abs(det) > 1e-8 可逆性 heuristic。后者不判断 SPD、下降或 TinyVBD C++ 的行为。
   Knobs：压缩比 l/l0、k (100 vs 1e8)、h。 */
(function () {
  window.VBWidgets["hessian-spd-guard"] = function (root) {
    const W = 560, H = 330; const c = (n) => VBW.c(n);
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
      const spd = minEig > 0;
      const invertibleHeuristic = Math.abs(det) > 1e-8;
      return { k, l, mh2, lamPar, lamPerp, e, det, minEig, spd, invertibleHeuristic };
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
      const labels = ["合成 λ∥", "合成 λ⊥ (a)", "合成 λ⊥ (b)"];
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

      // 读数 + 两项彼此独立的诊断
      const yb = 204; ctx.font = "12px var(--mono)";
      ctx.fillStyle = c("ink-soft");
      ctx.fillText("惯性底 m/h² = " + r.mh2.toLocaleString(), 30, yb);
      ctx.fillText("弹簧 k = " + r.k.toExponential(0) + "   λ⊥(裸) = k(1-l₀/l) = " + r.lamPerp.toExponential(1), 30, yb + 20);
      ctx.fillText("min 特征值 = " + r.minEig.toExponential(1), 30, yb + 40);
      ctx.fillText("det(H) = " + r.det.toExponential(2) + "   |det|>1e-8: " + (r.invertibleHeuristic ? "PASS" : "REJECT"), 30, yb + 60);
      // 诊断牌：故意展示 determinant 放行不定矩阵的情形
      ctx.font = "bold 14px var(--mono)";
      if (!r.spd && r.invertibleHeuristic) {
        ctx.fillStyle = "#e0463c";
        ctx.fillText("谱: INDEFINITE | det heuristic: PASS（仍可能上坡）", 30, yb + 88);
      } else if (!r.invertibleHeuristic) {
        ctx.fillStyle = c("warn");
        ctx.fillText("det heuristic: REJECT（只诊断近奇异，不判 SPD）", 30, yb + 88);
      } else {
        ctx.fillStyle = c("interactive");
        ctx.fillText("谱: SPD | det heuristic: PASS（两项结论独立）", 30, yb + 88);
      }
    }

    const r1 = VBW.row();
    r1.appendChild(VBW.slider("压缩比 l/l₀", 0.3, 2, 0.05, state.ratio, (v) => { state.ratio = v; draw(); }, (v) => v.toFixed(2)).wrap);
    r1.appendChild(VBW.slider("弹簧刚度 k", 1, 8, 1, state.kExp, (v) => { state.kExp = v; draw(); }, (v) => "1e" + (v | 0)).wrap);
    r1.appendChild(VBW.slider("1/h", 20, 120, 10, state.hInv, (v) => { state.hInv = v; draw(); }, (v) => "h=1/" + (v | 0)).wrap);
    root.appendChild(cv); root.appendChild(r1);
    const cap = VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "谱诊断用 min 特征值判断 SPD；determinant 诊断独立使用尺度相关的 |det|>1e-8。切到 k=1e8 并压缩，可看到 Hessian 不定但 determinant 仍巨大、heuristic 继续 PASS；只有特征值过零附近才 REJECT，继续压缩后 |det| 会再次增大。该 heuristic 来自 Newton/Warp 对照，不是 TinyVBD C++ 的 guard，也不保证下降。");
    root.appendChild(cap);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
