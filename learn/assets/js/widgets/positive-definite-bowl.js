/* positive-definite-bowl — 正定/不定/半正定的几何直觉。
   画二次型 z = ½(λ1·u² + λ2·v²) 的等高线地形：两个特征值 λ1,λ2 各管一个主方向。
   都正→碗(正定,唯一稳定谷底);一正一负→马鞍(不定,鞍点,某方向一推就滑);
   一个为0→山谷(半正定,沿谷底走能量不变)。放一个小球在原点附近，看它滚向哪——
   坐实「Hessian 正定 = 能量碗 = 稳定极小」「不定 = 马鞍 = 失稳(屈曲)」。 */
(function () {
  window.VBWidgets["positive-definite-bowl"] = function (root) {
    const W = 560, H = 300; const c = (n) => VBW.c(n);
    const st = { l1: 1.0, l2: 1.0 };   // 两个特征值

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    const cx = W * 0.34, cy = H / 2, R = 120;   // 地形图中心 + 半径(在画布左 2/3)
    function z(u, v) { return 0.5 * (st.l1 * u * u + st.l2 * v * v); }   // 二次型高度

    function classify() {
      const a = st.l1, b = st.l2, eps = 0.05;
      if (a > eps && b > eps) return { k: "pd", t: "正定 (都 > 0)", shape: "碗", col: c("interactive"), msg: "唯一稳定谷底——往任何方向推，能量都升、球都滚回来" };
      if (a < -eps && b < -eps) return { k: "nd", t: "负定 (都 < 0)", shape: "山顶", col: "#e0463c", msg: "孤峰——往任何方向推，能量都降、球都滚走" };
      if ((a > eps && b < -eps) || (a < -eps && b > eps)) return { k: "indef", t: "不定 (一正一负)", shape: "马鞍", col: "#e0463c", msg: "鞍点！沿正方向是谷、沿负方向是脊——往负方向一推就滑下去(这就是屈曲)" };
      return { k: "psd", t: "半正定 (有一个 ≈ 0)", shape: "山谷", col: c("warn") || "#c98a2b", msg: "平底山谷——沿谷底那条线走，能量不变(没有唯一极小)" };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cls = classify();
      // 等高线：在 [-1.4,1.4]² 网格上按 z 值上色 + 画几条等高线
      const N = 60, ext = 1.4;
      // 找 z 的范围用于归一
      let zmin = 1e9, zmax = -1e9;
      for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
        const u = -ext + 2 * ext * i / N, v = -ext + 2 * ext * j / N;
        const zz = z(u, v); if (zz < zmin) zmin = zz; if (zz > zmax) zmax = zz;
      }
      const span = (zmax - zmin) || 1;
      // 填充色块(低=深、高=浅)，用 teal/红区分正负高度
      const px = (u) => cx + u / ext * R, py = (v) => cy - v / ext * R;
      const cell = (2 * ext / N);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const u = -ext + 2 * ext * (i + 0.5) / N, v = -ext + 2 * ext * (j + 0.5) / N;
        const zz = z(u, v);
        const t = (zz - zmin) / span;             // 0 低 .. 1 高
        // 低处暖(谷底)、高处冷淡；用亮度编码
        const L = 22 + t * 50;
        ctx.fillStyle = `hsl(${zz >= 0 ? 190 : 8}, 45%, ${L}%)`;
        ctx.fillRect(px(u - cell / 2), py(v + cell / 2), R * 2 / N + 1, R * 2 / N + 1);
      }
      // 几条等高线
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1;
      for (let lv = 1; lv <= 5; lv++) {
        const target = zmin + span * lv / 6;
        ctx.beginPath();
        for (let a = 0; a < 360; a += 4) {
          // 沿角度找该等高值的半径(对二次型可解析,但数值扫更稳)
          const ang = a * Math.PI / 180, du = Math.cos(ang), dv = Math.sin(ang);
          // z(r·du,r·dv)=0.5(l1 du²+l2 dv²) r² = target → r²=target/(...)
          const denom = 0.5 * (st.l1 * du * du + st.l2 * dv * dv);
          if (denom <= 1e-6) continue;
          const r = Math.sqrt(target / denom); if (!isFinite(r) || r > ext) continue;
          const X = px(r * du), Y = py(r * dv);
          a === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
        }
        ctx.stroke();
      }
      // 主方向箭头(两个特征向量 = u,v 轴)
      function axis(dx, dy, lam, label) {
        const col = lam > 0.05 ? c("interactive") : lam < -0.05 ? "#e0463c" : (c("warn") || "#c98a2b");
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px(dx * ext * 0.9), py(dy * ext * 0.9)); ctx.stroke();
        ctx.fillStyle = col; ctx.font = "11px var(--mono)";
        ctx.fillText(label + (lam > 0.05 ? "↑升" : lam < -0.05 ? "↓降" : "·平"), px(dx * ext * 0.95) - 8, py(dy * ext * 0.95) - 4);
      }
      axis(1, 0, st.l1, "λ₁");
      axis(0, 1, st.l2, "λ₂");
      // 中心点(临界点)
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 7); ctx.fill();

      // 右侧文字面板
      const tx = W * 0.68;
      ctx.fillStyle = cls.col; ctx.font = "bold 15px var(--mono)";
      ctx.fillText(cls.shape, tx, 40);
      ctx.fillStyle = c("ink"); ctx.font = "12px var(--mono)";
      ctx.fillText(cls.t, tx, 62);
      ctx.fillStyle = c("ink-soft"); ctx.font = "11px var(--mono)";
      // 折行
      let line = "", yy = 90;
      cls.msg.split("").forEach((ch) => { if (ctx.measureText(line + ch).width > W - tx - 16) { ctx.fillText(line, tx, yy); line = ch; yy += 16; } else line += ch; });
      ctx.fillText(line, tx, yy);
      ctx.fillStyle = c("ink-faint"); ctx.font = "10px var(--mono)";
      ctx.fillText("z = ½(λ₁u² + λ₂v²)", tx, H - 30);
      ctx.fillText("Hessian 的特征值 = 各主方向的「弯曲」", tx, H - 14);
    }

    const r1 = VBW.row();
    r1.appendChild(VBW.slider("λ₁ (主方向1)", -2, 2, 0.1, st.l1, (v) => { st.l1 = v; draw(); }, (v) => v.toFixed(1)).wrap);
    r1.appendChild(VBW.slider("λ₂ (主方向2)", -2, 2, 0.1, st.l2, (v) => { st.l2 = v; draw(); }, (v) => v.toFixed(1)).wrap);
    root.appendChild(cv); root.appendChild(r1);
    root.appendChild(VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "Hessian 的两个特征值 λ₁,λ₂ 就是能量面在两个主方向上的「弯曲」。两个都正 → 碗(正定 = 唯一稳定谷底,推哪都回弹);一正一负 → 马鞍(不定 = 鞍点,沿负方向一推就滑下去——这正是压缩弹簧的屈曲);有一个为 0 → 山谷(半正定,沿谷底能量不变)。把 λ₂ 从正拖到负,看碗怎么塌成马鞍。"));
    window.addEventListener("themechange", draw); draw();
  };
})();
