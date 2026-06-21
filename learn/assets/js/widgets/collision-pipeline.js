/* collision-pipeline — 9-3 Newton cloth 自碰的三段机器：BVH 检测 → log-barrier 力进 f_i/H_i → penetration-free 截断。
   左：阶段流水线（高亮当前）。右：一个顶点逼近三角形的小场景，演示 barrier 把它推开 +（可关）截断兜底。
   "关掉截断 → 看它一步穿过去" toggle，坐实 warn callout 的"两层防线，少一层就穿帮"。 */
(function () {
  window.VBWidgets["collision-pipeline"] = function (root) {
    const W = 560, H = 300; const c = (n) => VBW.c(n);
    const stages = [
      { k: "detect", t: "① BVH 检测", d: "TriMeshCollisionDetector 用 BVH 找 vertex-triangle / edge-edge 逼近对，记最小距离 → 邻近清单" },
      { k: "force", t: "② log-barrier 力", d: "accumulate_self_contact_force_and_hessian：把接触换成力/3×3 Hessian，累加进同一个 f_i / H_i" },
      { k: "trunc", t: "③ penetration-free 截断", d: "每个 color sweep 后按保守距离界砍位移（DAT）——几何硬兜底，挡住跨步穿透" },
    ];
    const state = { stage: 0, truncation: true };
    const wallY = 200, vy = 70;

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // 左：流水线
      ctx.font = "13px var(--mono)"; let y = 36;
      stages.forEach((s, i) => {
        const on = i === state.stage;
        ctx.fillStyle = on ? c("interactive") : c("ink-faint");
        ctx.beginPath(); ctx.arc(24, y - 4, on ? 7 : 5, 0, 7); ctx.fill();
        ctx.fillStyle = on ? c("ink") : c("ink-faint"); ctx.font = on ? "bold 13px var(--mono)" : "13px var(--mono)";
        ctx.fillText(s.t, 40, y); y += 26;
      });
      ctx.fillStyle = c("ink-soft"); ctx.font = "11px var(--mono)";
      const desc = stages[state.stage].d; let line = "", yy = y + 8;
      desc.split("").forEach((ch) => { if (ctx.measureText(line + ch).width > 300) { ctx.fillText(line, 24, yy); line = ch; yy += 16; } else line += ch; });
      ctx.fillText(line, 24, yy);

      ctx.strokeStyle = c("border"); ctx.beginPath(); ctx.moveTo(340, 20); ctx.lineTo(340, H - 16); ctx.stroke();

      // 右：顶点逼近三角形（用一条线代表三角形面）
      const RX = 360;
      ctx.strokeStyle = c("ink-soft"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(RX, wallY); ctx.lineTo(W - 16, wallY); ctx.stroke();
      ctx.fillStyle = "rgba(120,120,120,.10)"; ctx.fillRect(RX, wallY, W - 16 - RX, H - wallY - 6);
      ctx.fillStyle = c("ink-faint"); ctx.font = "10px var(--mono)"; ctx.fillText("三角形面", RX + 6, wallY + 16);

      const vx = (RX + W - 16) / 2;
      // 顶点落点取决于阶段 + 截断
      let vyNow = vy;
      if (state.stage === 0) { // 检测：画 BVH 包围盒 + 距离线
        ctx.strokeStyle = c("warn"); ctx.setLineDash([4, 3]); ctx.strokeRect(vx - 26, vy - 26, 52, 80); ctx.setLineDash([]);
        ctx.strokeStyle = c("border"); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx, wallY); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = c("warn"); ctx.font = "10px var(--mono)"; ctx.fillText("AABB", vx - 24, vy - 30);
      } else if (state.stage === 1) { // barrier 力：箭头把顶点往上推
        vyNow = vy + 40;
        ctx.strokeStyle = c("interactive"); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(vx, vyNow + 30); ctx.lineTo(vx, vyNow + 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(vx - 5, vyNow + 14); ctx.lineTo(vx, vyNow + 4); ctx.lineTo(vx + 5, vyNow + 14); ctx.fillStyle = c("interactive"); ctx.fill();
        ctx.fillStyle = c("interactive"); ctx.font = "10px var(--mono)"; ctx.fillText("barrier 排斥力", vx + 10, vyNow + 20);
      } else { // 截断
        if (state.truncation) { vyNow = wallY - 14; ctx.fillStyle = c("interactive"); ctx.font = "11px var(--mono)"; ctx.fillText("✓ 截断：停在面前", vx + 10, vyNow); }
        else { vyNow = wallY + 26; ctx.fillStyle = "#e0463c"; ctx.font = "11px var(--mono)"; ctx.fillText("✗ 穿透！", vx + 10, vyNow);
          ctx.fillStyle = "rgba(224,70,60,.4)"; ctx.fillRect(vx - 18, wallY, 36, vyNow - wallY); }
      }
      ctx.fillStyle = (state.stage === 2 && !state.truncation) ? "#e0463c" : c("accent") || "#6b5bd6";
      ctx.beginPath(); ctx.arc(vx, vyNow, 6, 0, 7); ctx.fill();
      ctx.fillStyle = c("ink-faint"); ctx.font = "10px var(--mono)"; ctx.fillText("顶点", vx - 30, vyNow);
    }

    const r1 = VBW.row();
    const mk = (t, f) => { const b = VBW.el("button", null, t); b.style.cssText = "margin-right:8px;padding:6px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--ink);cursor:pointer;font:13px var(--mono)"; b.addEventListener("click", f); return b; };
    r1.appendChild(mk("◀ 上一阶段", () => { state.stage = (state.stage + 2) % 3; draw(); }));
    r1.appendChild(mk("下一阶段 ▶", () => { state.stage = (state.stage + 1) % 3; draw(); }));
    const r2 = VBW.row();
    r2.appendChild(VBW.toggle("启用 penetration-free 截断", state.truncation, (v) => { state.truncation = v; state.stage = 2; draw(); }));
    root.appendChild(cv); root.appendChild(r1); root.appendChild(r2);
    const cap = VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "逐阶段走 Newton cloth 自碰的三段机器。走到阶段③把「截断」关掉：barrier 软挡不住的那一步会直接穿过三角形（红）——这就是为什么 9-3 强调能量挡 + 几何截断是两层防线，少一层就穿帮。");
    root.appendChild(cap);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
