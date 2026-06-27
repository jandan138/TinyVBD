/* abd-affine — Affine Body Dynamics 的核心直觉：一个物体只用一个仿射变换 A（2×2）+ 平移描述，
   "刚度"由一个 orthogonality（正交）能量控制：能量越大，A 被越用力拉向「纯旋转」（近刚体）；
   能量越小，A 容许明显的剪切/拉伸（可形变）。调"外加形变"与"正交刚度"，看 A 在两者间平衡，
   并实时显示 A 偏离正交的程度 ‖AᵀA−I‖。把"近刚体 = 容许一点点形变的仿射体"演成手感。 */
(function () {
  window.VBWidgets["abd-affine"] = function (root) {
    const W = 560, H = 300; const c = (n) => VBW.c(n);
    const st = { load: 0.5, kOrtho: 0.5, angle: 25 };   // load=外加剪切量, kOrtho=正交刚度, angle=想要的旋转角(度)

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    // rest 物体：以原点为中心的单位正方形四角
    const rest = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

    // 目标（外加）仿射：一个旋转 θ + 剪切 load  →  A_target
    function targetA() {
      const th = st.angle * Math.PI / 180, ct = Math.cos(th), s = Math.sin(th);
      const R = [ct, -s, s, ct];                 // 纯旋转
      const sh = st.load;                        // 剪切量
      const Shear = [1, sh, 0, 1];               // 上三角剪切
      // A_target = R · Shear
      return [R[0] * Shear[0] + R[1] * Shear[2], R[0] * Shear[1] + R[1] * Shear[3],
              R[2] * Shear[0] + R[3] * Shear[2], R[2] * Shear[1] + R[3] * Shear[3]];
    }
    // 最近的纯旋转（A_target 的极分解里的 R）：用 2×2 闭式
    function nearestRotation(A) {
      const th = Math.atan2(A[2] - A[1], A[0] + A[3]);   // 2D 极分解的旋转角
      const ct = Math.cos(th), s = Math.sin(th);
      return [ct, -s, s, ct];
    }
    // 平衡 A：在「外加形变 A_target」与「最近旋转 R」之间，按正交刚度做加权混合
    // kOrtho 越大 → 越贴近 R（近刚体）；越小 → 越贴近 A_target（可形变）
    function equilibriumA() {
      const At = targetA(), R = nearestRotation(At);
      const w = st.kOrtho;                       // 0..1：贴向 R 的权重
      return At.map((v, i) => (1 - w) * v + w * R[i]);
    }
    // 正交误差 ‖AᵀA − I‖_F
    function orthoError(A) {
      const ATA = [A[0] * A[0] + A[2] * A[2], A[0] * A[1] + A[2] * A[3],
                   A[1] * A[0] + A[3] * A[2], A[1] * A[1] + A[3] * A[3]];
      const d = [ATA[0] - 1, ATA[1], ATA[2], ATA[3] - 1];
      return Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2] + d[3] * d[3]);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const A = equilibriumA(), At = targetA();
      const cx = W / 2, cy = H / 2 - 10, SC = 52;
      function xform(A, p) { return [cx + (A[0] * p[0] + A[1] * p[1]) * SC, cy + (A[2] * p[0] + A[3] * p[1]) * SC]; }

      // rest 形状（淡灰参考）
      ctx.strokeStyle = c("border"); ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); rest.forEach((p, i) => { const x = cx + p[0] * SC, y = cy + p[1] * SC; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = c("ink-faint"); ctx.font = "10px var(--mono)"; ctx.fillText("rest 形状", cx - 24, cy - 4 * SC / 4 - 60 + 60);

      // 外加形变 A_target（虚线，红——"你想这么使劲掰它"）
      ctx.strokeStyle = "#e0463c"; ctx.globalAlpha = 0.5; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.4;
      ctx.beginPath(); rest.forEach((p, i) => { const q = xform(At, p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;

      // 平衡仿射体 A（实心 teal）
      ctx.fillStyle = (c("interactive")) + "22"; ctx.strokeStyle = c("interactive"); ctx.lineWidth = 2.4;
      ctx.beginPath(); rest.forEach((p, i) => { const q = xform(A, p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fill(); ctx.stroke();
      rest.forEach((p) => { const q = xform(A, p); ctx.fillStyle = c("accent") || "#6b5bd6"; ctx.beginPath(); ctx.arc(q[0], q[1], 4, 0, 7); ctx.fill(); });

      // 读数
      const err = orthoError(A);
      const rigid = err < 0.05;
      ctx.fillStyle = c("ink"); ctx.font = "12px var(--mono)";
      ctx.fillText("仿射变换 A = [ " + A[0].toFixed(2) + "  " + A[1].toFixed(2) + " ;  " + A[2].toFixed(2) + "  " + A[3].toFixed(2) + " ]", 20, H - 44);
      ctx.fillStyle = rigid ? c("interactive") : (err < 0.4 ? (c("warn") || "#c98a2b") : "#e0463c");
      ctx.fillText("正交误差 ‖AᵀA−I‖ = " + err.toFixed(3) + (rigid ? "  ≈0 → 几乎纯旋转（近刚体）" : "  >0 → 容许形变（仿射体）"), 20, H - 24);
      // 图例
      ctx.font = "10px var(--mono)";
      ctx.fillStyle = "#e0463c"; ctx.fillText("⌐ 外加形变（你想掰成的样子）", W - 230, 20);
      ctx.fillStyle = c("interactive"); ctx.fillText("■ 平衡后的仿射体", W - 230, 36);
      ctx.fillStyle = c("ink-faint"); ctx.fillText("整个物体只有这 4 个数（A）+ 平移 = 6 个 DOF（2D）", 20, 22);
    }

    const r1 = VBW.row();
    r1.appendChild(VBW.slider("外加形变（剪切）", 0, 1.2, 0.05, st.load, (v) => { st.load = v; draw(); }, (v) => v.toFixed(2)).wrap);
    r1.appendChild(VBW.slider("正交刚度（拉向刚性）", 0, 1, 0.05, st.kOrtho, (v) => { st.kOrtho = v; draw(); }, (v) => v.toFixed(2)).wrap);
    const r2 = VBW.row();
    r2.appendChild(VBW.slider("旋转角 θ", 0, 90, 5, st.angle, (v) => { st.angle = v; draw(); }, (v) => v.toFixed(0) + "°").wrap);
    root.appendChild(cv); root.appendChild(r1); root.appendChild(r2);
    root.appendChild(VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "整块物体只用一个仿射变换 A（2D 是 4 个数）+ 平移来描述——这就是 ABD「紧凑坐标」的精髓。把「外加形变」调大，红色虚线想把它掰出明显剪切；把「正交刚度」调大，A 被越用力拉回纯旋转（正交误差→0、≈近刚体）。低刚度则容许可见形变。ABD 就是这样：保留刚体的紧凑坐标，但用一个正交能量软性地近似刚性，硬度可调。"));
    window.addEventListener("themechange", draw); draw();
  };
})();
