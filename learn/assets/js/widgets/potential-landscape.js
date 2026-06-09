/* potential-landscape — 把一步隐式欧拉「画成一座山谷」。
   单个粒子，G(p) = w_I·|p - y|²  +  ½k(|p - anchor| - L)²。
   惯性项是一个以预测位置 y 为中心的碗；弹性项是一个以 rest length 为半径的环形谷。
   最小值落在二者的「拔河」平衡点。拖动 w_I / k 看平衡点移动。 */
(function () {
  window.VBWidgets["potential-landscape"] = function (root) {
    const W = 460, H = 360;
    const c = (n) => VBW.c(n);
    let wI = 1.0, k = 2.0;
    const anchor = { x: 0.28, y: 0.78 }, L = 0.30, y = { x: 0.74, y: 0.30 };
    let test = { x: 0.55, y: 0.5 };

    function G(p) {
      const di = Math.hypot(p.x - y.x, p.y - y.y);
      const da = Math.hypot(p.x - anchor.x, p.y - anchor.y);
      return wI * di * di + 0.5 * k * (da - L) * (da - L);
    }
    // 几步牛顿/梯度下降找最小值
    function argmin() {
      let p = { x: y.x, y: y.y };
      for (let it = 0; it < 80; it++) {
        const da = Math.hypot(p.x - anchor.x, p.y - anchor.y) || 1e-6;
        const gx = 2 * wI * (p.x - y.x) + k * (da - L) * (p.x - anchor.x) / da;
        const gy = 2 * wI * (p.y - y.y) + k * (da - L) * (p.y - anchor.y) / da;
        p.x -= 0.05 * gx; p.y -= 0.05 * gy;
      }
      return p;
    }

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;border-radius:10px;cursor:crosshair";
    const X = (u) => u * W, Y = (v) => v * H;
    const ux = (px) => px / W, uy = (py) => py / H;

    function draw() {
      // 热力图
      const img = ctx.createImageData(W, H);
      let gmax = 0;
      const grid = [];
      for (let j = 0; j < H; j += 2) for (let i = 0; i < W; i += 2) {
        const g = G({ x: i / W, y: j / H }); grid.push([i, j, g]); if (g < 3) gmax = Math.max(gmax, g);
      }
      gmax = gmax || 1;
      for (const [i, j, g] of grid) {
        const t = VBW.clamp(g / gmax, 0, 1);
        // 低 G = 深谷（亮青），高 G = 暗
        const band = (Math.sin(g / gmax * 26) * 0.5 + 0.5) * 0.18; // 等高线纹理
        const r = Math.round(20 + t * 30), gg = Math.round((1 - t) * 150 + band * 255), b = Math.round((1 - t) * 150 + 40);
        for (let dj = 0; dj < 2; dj++) for (let di = 0; di < 2; di++) {
          const idx = ((j + dj) * W + (i + di)) * 4;
          img.data[idx] = r; img.data[idx + 1] = gg; img.data[idx + 2] = b; img.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);

      // 弹性 rest 环
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(X(anchor.x), Y(anchor.y), L * W, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      // anchor
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(X(anchor.x), Y(anchor.y), 5, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.font = "11px monospace";
      ctx.fillText("anchor (rest 环)", X(anchor.x) - 30, Y(anchor.y) + 20);
      // 惯性目标 y
      ctx.fillStyle = "#ffd36b"; ctx.beginPath(); ctx.arc(X(y.x), Y(y.y), 5, 0, 7); ctx.fill();
      ctx.fillText("惯性目标 y", X(y.x) - 20, Y(y.y) - 10);
      // 最小值
      const m = argmin();
      ctx.fillStyle = "#37e0c4"; ctx.beginPath(); ctx.arc(X(m.x), Y(m.y), 7, 0, 7); ctx.fill();
      ctx.strokeStyle = "#0b3"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(m.x), Y(m.y), 11, 0, 7); ctx.stroke();
      ctx.fillStyle = "#37e0c4"; ctx.fillText("argmin G = x^{t+1}", X(m.x) + 12, Y(m.y));
      // 测试点
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "#000"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(X(test.x), Y(test.y), 4, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillText("G(test) = " + G(test).toFixed(3), 10, H - 12);
    }

    function setTest(e) {
      const r = cv.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      test = { x: VBW.clamp((t.clientX - r.left) / r.width, 0, 1), y: VBW.clamp((t.clientY - r.top) / r.height, 0, 1) };
      draw();
    }
    let down = false;
    cv.addEventListener("mousedown", (e) => { down = true; setTest(e); });
    window.addEventListener("mousemove", (e) => { if (down) setTest(e); });
    window.addEventListener("mouseup", () => { down = false; });

    const ctrls = VBW.row();
    const s1 = VBW.slider("惯性权重 w_I = m/(2h²)", 0.1, 4, 0.1, wI, (v) => { wI = v; draw(); }, (v) => v.toFixed(1));
    const s2 = VBW.slider("弹簧刚度 k", 0.2, 8, 0.2, k, (v) => { k = v; draw(); }, (v) => v.toFixed(1));
    ctrls.appendChild(s1.wrap); ctrls.appendChild(s2.wrap);
    const note = VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "把 w_I 调大（小 h 或大质量）→ 最小值被惯性拉向 y；把 k 调大 → 最小值被拽回 rest 环。这正是一步隐式欧拉在做的「拔河」。");
    root.appendChild(cv); root.appendChild(ctrls); root.appendChild(note);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
