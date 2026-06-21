/* contact-three-ways — 三种接触处理在「一个物体被持续往地面压」时的穿透深度对照。
   penalty：软弹簧回推，压力越大穿得越深（永远有残余穿透）。
   AVBD：penalty 随迭代 ramp 变硬，穿透被逐步压小，但仍是逼近。
   IPC：log-barrier + 可行域内步长，距离永远 > 0，穿透恒为 0。
   调外压力 P 看三者残余穿透怎么变——IPC 那条始终贴地不破。 */
(function () {
  window.VBWidgets["contact-three-ways"] = function (root) {
    const W = 560, H = 280;
    const c = (n) => VBW.c(n);
    const state = { press: 1.2 };          // 外部压力（往下）
    const groundY = 200, restH = 90;       // 地面与物体静止高度
    const boxW = 70;

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    // 三种方法稳态时「物体底面相对地面的位置」（>0 在地面上方=有间隙；<0 穿透）
    function penetrations() {
      const P = state.press;
      // penalty：穿透 δ 使回推力 k·δ = P → δ = P/k_soft（软，明显穿）
      const kSoft = 1.5;
      const penPen = P / kSoft;                       // 残余穿透（正=穿入深度）
      // AVBD：等效刚度被 ramp 放大 R 倍 → 穿透小一个量级，但非零
      const R = 12;
      const avbdPen = P / (kSoft * R);
      // IPC：barrier + CCD line search → 距离恒 >0，穿透为 0
      const ipcPen = 0;
      return { penPen, avbdPen, ipcPen };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const pen = penetrations();
      const lanes = [
        { x: 95,  label: "penalty",      depth: pen.penPen,  col: c("pbd") || "#c98a2b", note: "软，残余穿透大" },
        { x: 280, label: "AVBD",         depth: pen.avbdPen, col: c("accent") || "#6b5bd6", note: "ramp 变硬，穿透小" },
        { x: 465, label: "IPC",          depth: pen.ipcPen,  col: c("interactive"), note: "barrier，永不穿" },
      ];
      lanes.forEach((L) => {
        // 地面线
        ctx.strokeStyle = c("ink-soft"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(L.x - 80, groundY); ctx.lineTo(L.x + 80, groundY); ctx.stroke();
        // 地面下阴影
        ctx.fillStyle = "rgba(120,120,120,.10)";
        ctx.fillRect(L.x - 80, groundY, 160, H - groundY - 4);

        // 物体：底面 = groundY + depth*scale（depth>0 → 穿入地面下方）
        const scale = 26;
        const bottom = groundY + L.depth * scale;
        const top = bottom - restH;
        ctx.fillStyle = L.col; ctx.globalAlpha = 0.85;
        ctx.fillRect(L.x - boxW / 2, top, boxW, restH);
        ctx.globalAlpha = 1;

        // 压力箭头
        ctx.strokeStyle = c("ink-soft"); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(L.x, top - 30); ctx.lineTo(L.x, top - 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(L.x - 5, top - 12); ctx.lineTo(L.x, top - 4); ctx.lineTo(L.x + 5, top - 12); ctx.fill();

        // 穿透高亮
        if (L.depth > 1e-4) {
          ctx.fillStyle = "#e0463c"; ctx.globalAlpha = 0.5;
          ctx.fillRect(L.x - boxW / 2, groundY, boxW, bottom - groundY);
          ctx.globalAlpha = 1;
        }

        // 标签
        ctx.fillStyle = c("ink"); ctx.font = "13px var(--mono)"; ctx.textAlign = "center";
        ctx.fillText(L.label, L.x, 28);
        ctx.fillStyle = L.depth > 1e-4 ? "#e0463c" : c("interactive"); ctx.font = "12px var(--mono)";
        ctx.fillText(L.depth > 1e-4 ? ("穿透 " + L.depth.toFixed(2)) : "穿透 0.00", L.x, H - 30);
        ctx.fillStyle = c("ink-faint"); ctx.font = "10px var(--mono)";
        ctx.fillText(L.note, L.x, H - 14);
        ctx.textAlign = "left";
      });
      // 压力标
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
      ctx.fillText("外压力 P = " + state.press.toFixed(1), 12, 16);
    }

    const r1 = VBW.row();
    r1.appendChild(VBW.slider("外压力 P", 0.2, 3, 0.1, state.press, (v) => { state.press = v; draw(); }, (v) => v.toFixed(1)).wrap);

    root.appendChild(cv); root.appendChild(r1);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
