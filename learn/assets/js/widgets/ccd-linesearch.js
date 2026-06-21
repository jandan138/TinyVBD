/* ccd-linesearch — IPC intersection-free 的真正来源：CCD-filtered line search。
   一个点要从当前位置朝 full Newton step 的目标走；目标在墙（地面线）另一侧 → 朴素一步会穿过去。
   CCD 求出最大安全步长 α（再留一道 d̂ 保守界），line search 把步长截到可行域内，点永远停在墙前。
   调 Newton step 大小与 d̂，看 α 怎么变、点怎么永远不穿。 */
(function () {
  window.VBWidgets["ccd-linesearch"] = function (root) {
    const W = 560, H = 300;
    const c = (n) => VBW.c(n);
    // 墙（地面）是一条水平线 y = wallY；点在其上方，Newton 目标在其下方
    const wallY = 210;
    const state = { step: 1.6, dhat: 16, useCCD: true };
    const p0 = { x: 150, y: 80 };     // 当前位置
    // Newton 方向：朝右下，穿过墙
    const dir = { x: 180, y: 200 };

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // full Newton target
      const target = { x: p0.x + dir.x * state.step, y: p0.y + dir.y * state.step };

      // CCD：沿 p0→target，求到达墙（含 d̂ 保守余量）的最大 α∈[0,1]
      // 触墙的 α_hit：p0.y + α*dir.y*step = wallY  →  α_hit
      const vy = dir.y * state.step;
      let alphaSafe = 1;
      if (vy > 0) {
        const alphaHit = (wallY - p0.y) / vy;
        // 保守界：留出 d̂ 距离（不允许贴到墙，停在 wallY - d̂ 的某比例处）
        const alphaConserv = (wallY - state.dhat - p0.y) / vy;
        alphaSafe = VBW.clamp(Math.min(alphaConserv, alphaHit), 0, 1);
        if (!state.useCCD) alphaSafe = 1;   // 关掉 CCD：放任穿透
      }
      const land = { x: p0.x + dir.x * state.step * alphaSafe, y: p0.y + dir.y * state.step * alphaSafe };
      const penetrates = land.y > wallY;

      // 墙
      ctx.strokeStyle = c("ink-soft"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(20, wallY); ctx.lineTo(W - 20, wallY); ctx.stroke();
      // 墙下阴影
      ctx.fillStyle = c("surface-3") || "rgba(120,120,120,.12)";
      ctx.globalAlpha = 0.35; ctx.fillRect(20, wallY, W - 40, H - wallY - 6); ctx.globalAlpha = 1;
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
      ctx.fillText("墙 / 地面（不可穿透）", 26, wallY + 18);
      // d̂ 余量线
      ctx.strokeStyle = c("warn"); ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(20, wallY - state.dhat); ctx.lineTo(W - 20, wallY - state.dhat); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = c("warn"); ctx.fillText("d̂ 保守余量", W - 130, wallY - state.dhat - 6);

      // full Newton step（虚线，到 target）
      ctx.strokeStyle = c("ink-faint"); ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(target.x, target.y); ctx.stroke();
      ctx.setLineDash([]);
      // 截断后实际走的一段（实线）
      ctx.strokeStyle = c("interactive"); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(land.x, land.y); ctx.stroke();

      // 点：起点、target、落点
      function dot(p, col, r) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill(); }
      dot(p0, c("ink-soft"), 5);
      dot(target, penetrates ? "#e0463c" : c("ink-faint"), 5);
      dot(land, penetrates ? "#e0463c" : c("interactive"), 6);

      // 标注
      ctx.fillStyle = c("ink-soft"); ctx.font = "12px var(--mono)";
      ctx.fillText("p₀", p0.x - 22, p0.y + 4);
      ctx.fillText("full step 目标", target.x + 8, target.y + 4);
      ctx.fillStyle = c("ink-faint");
      ctx.fillText("α = " + alphaSafe.toFixed(2), p0.x + 8, p0.y - 8);

      // 状态条
      ctx.font = "13px var(--mono)";
      if (penetrates) {
        ctx.fillStyle = "#e0463c"; ctx.fillText("⚠ 穿透！（CCD 关闭时朴素一步直接穿墙）", 26, 28);
      } else {
        ctx.fillStyle = c("interactive"); ctx.fillText("✓ intersection-free：line search 把步长截到 α=" + alphaSafe.toFixed(2), 26, 28);
      }
    }

    const r1 = VBW.row();
    r1.appendChild(VBW.slider("Newton step 大小", 0.6, 2.2, 0.1, state.step, (v) => { state.step = v; draw(); }, (v) => "×" + v.toFixed(1)).wrap);
    r1.appendChild(VBW.slider("d̂ 保守余量", 0, 40, 2, state.dhat, (v) => { state.dhat = v; draw(); }, (v) => v.toFixed(0)).wrap);
    const r2 = VBW.row();
    r2.appendChild(VBW.toggle("启用 CCD line search", state.useCCD, (v) => { state.useCCD = v; draw(); }));

    root.appendChild(cv); root.appendChild(r1); root.appendChild(r2);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
