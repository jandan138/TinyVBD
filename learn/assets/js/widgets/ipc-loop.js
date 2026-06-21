/* ipc-loop — 一次 IPC 外迭代的流水线动画：assemble → PSD-project → solve p → CCD t* → line-search α → accept。
   左侧高亮当前阶段；右侧点-墙小场景同步显示「full step（虚线，可能穿墙）vs 截断后 α 步（实线，停墙前）」。
   单步 / 自动播放。用 VBW 工具，不用 Math.random/Date.now（动画用 requestAnimationFrame 的时间戳驱动相位）。 */
(function () {
  window.VBWidgets["ipc-loop"] = function (root) {
    const W = 560, H = 300;
    const c = (n) => VBW.c(n);
    const stages = [
      { k: "assemble", t: "装配 H, f", d: "遍历所有顶点/接触对，累加惯性+弹性+barrier 的力与 Hessian → 全局稀疏 H、f" },
      { k: "psd",      t: "PSD 投影", d: "对每块局部 Hessian 投负特征值为零，保证全局 H 半正定 → Newton 方向必下降" },
      { k: "solve",    t: "解方向 p", d: "全局稀疏线性解 H p = f（CHOLMOD 分解）→ 得到这一步的下降方向 p" },
      { k: "ccd",      t: "CCD 求 t*", d: "filtered CCD 沿 p 求最大不穿透步长 t*（time of impact）" },
      { k: "ls",       t: "line search α", d: "α = min(α_Newton, c·t*, α_CFL)：既要能量下降，又不许跨过几何边界" },
      { k: "accept",   t: "接受 / 收敛判据", d: "x ← x + α p；若 ‖∇G‖ 足够小则收敛，否则回到装配做下一轮" },
    ];
    let cur = 0, auto = false, lastPhase = 0;

    const wrap = VBW.el("div", { style: "display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start" });
    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;display:block;background:var(--surface-2);border-radius:10px";
    wrap.appendChild(cv);

    // 右侧点-墙小场景几何
    const wallY = 215, p0 = { x: 150, y: 70 }, dir = { x: 150, y: 210 };

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // ===== 左半：流水线阶段列表 =====
      const colW = 300, x0 = 16; let y = 30;
      ctx.font = "13px var(--mono)";
      stages.forEach((s, i) => {
        const on = i === cur, done = i < cur;
        ctx.fillStyle = on ? (c("interactive")) : (done ? c("ink-soft") : c("ink-faint"));
        // 阶段编号圆点
        ctx.beginPath(); ctx.arc(x0 + 7, y - 4, on ? 7 : 5, 0, 7); ctx.fill();
        ctx.fillStyle = on ? c("ink") : c("ink-faint");
        ctx.font = on ? "bold 13px var(--mono)" : "13px var(--mono)";
        ctx.fillText((i + 1) + ". " + s.t, x0 + 22, y);
        y += 22;
      });
      // 当前阶段说明（折行）
      ctx.fillStyle = c("ink-soft"); ctx.font = "12px var(--mono)";
      const desc = stages[cur].d, maxw = colW - 20; let line = "", yy = y + 8;
      desc.split("").forEach((ch) => {
        if (ctx.measureText(line + ch).width > maxw) { ctx.fillText(line, x0, yy); line = ch; yy += 18; }
        else line += ch;
      });
      ctx.fillText(line, x0, yy);

      // 分隔线
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(330, 16); ctx.lineTo(330, H - 16); ctx.stroke();

      // ===== 右半：点-墙小场景 =====
      const ox = 12; // 右半内部偏移参照（坐标已写死在 350+ 区域）
      const RX = 350;
      // 墙
      ctx.strokeStyle = c("ink-soft"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(RX, wallY); ctx.lineTo(W - 16, wallY); ctx.stroke();
      ctx.fillStyle = "rgba(120,120,120,.10)"; ctx.fillRect(RX, wallY, W - 16 - RX, H - wallY - 6);
      ctx.fillStyle = c("ink-faint"); ctx.font = "10px var(--mono)";
      ctx.fillText("墙（不可穿透）", RX + 6, wallY + 16);

      // 是否已算出方向（solve 之后才画 p），是否已截断（ls/accept 之后用 α）
      const showDir = cur >= 2;
      const target = { x: p0.x + dir.x, y: p0.y + dir.y };
      // t*：到墙的比例
      const tStar = (wallY - p0.y) / dir.y;
      const alpha = Math.max(0, tStar - 0.10);   // CFL 收一点
      const showAlpha = cur >= 4;
      const land = { x: p0.x + dir.x * (showAlpha ? alpha : 0), y: p0.y + dir.y * (showAlpha ? alpha : 0) };

      if (showDir) {
        // full step 虚线（穿墙）
        ctx.strokeStyle = c("ink-faint"); ctx.setLineDash([6, 5]); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(target.x, target.y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = c("ink-faint"); ctx.fillText("full step (p)", target.x - 30, target.y + 4);
      }
      // CCD 阶段：画 t* 命中点
      if (cur === 3) {
        const hit = { x: p0.x + dir.x * tStar, y: wallY };
        ctx.fillStyle = c("warn"); ctx.beginPath(); ctx.arc(hit.x, hit.y, 5, 0, 7); ctx.fill();
        ctx.fillText("t* (time of impact)", hit.x - 30, hit.y - 8);
      }
      if (showAlpha) {
        ctx.strokeStyle = c("interactive"); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(land.x, land.y); ctx.stroke();
        ctx.fillStyle = c("interactive"); ctx.font = "11px var(--mono)";
        ctx.fillText("α 步（停墙前）", land.x + 8, land.y);
      }
      // 起点
      ctx.fillStyle = c("ink-soft"); ctx.beginPath(); ctx.arc(p0.x, p0.y, 5, 0, 7); ctx.fill();
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)"; ctx.fillText("xₖ", p0.x - 20, p0.y);
      if (cur === 5) { ctx.fillStyle = c("interactive"); ctx.beginPath(); ctx.arc(land.x, land.y, 6, 0, 7); ctx.fill(); ctx.fillText("xₖ₊₁", land.x + 8, land.y + 16); }
    }

    // 控件
    const ctrls = VBW.el("div", { class: "ctrl-row", style: "margin-top:8px" });
    const stepBtn = VBW.el("button", { class: "seg" }, "");
    const bStep = VBW.el("button", null, "单步 ▶");
    const bAuto = VBW.el("button", null, "自动");
    const bReset = VBW.el("button", null, "重置");
    [bStep, bAuto, bReset].forEach((b) => { b.style.cssText = "margin-right:8px;padding:6px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--ink);cursor:pointer;font:13px var(--mono)"; });
    bStep.addEventListener("click", () => { cur = (cur + 1) % stages.length; draw(); });
    bReset.addEventListener("click", () => { cur = 0; auto = false; bAuto.textContent = "自动"; draw(); });
    bAuto.addEventListener("click", () => { auto = !auto; bAuto.textContent = auto ? "暂停" : "自动"; if (auto) requestAnimationFrame(tick); });
    ctrls.appendChild(bStep); ctrls.appendChild(bAuto); ctrls.appendChild(bReset);

    function tick(ts) {
      if (!auto) return;
      if (ts - lastPhase > 1100) { cur = (cur + 1) % stages.length; lastPhase = ts; draw(); }
      requestAnimationFrame(tick);
    }

    root.appendChild(wrap); root.appendChild(ctrls);
    const cap = VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "单步走完一次 IPC 外迭代的六个阶段：装配 H/f → PSD 投影 → 解方向 p → CCD 求 t* → line search 定 α → 接受更新。右侧同步看：full step（虚线）想穿墙，CCD+line search 把它截到 α 步（实线），xₖ₊₁ 停在墙前。");
    root.appendChild(cap);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
