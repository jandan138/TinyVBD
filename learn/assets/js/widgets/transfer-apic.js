/* transfer-apic — PIC / FLIP / APIC 三种 particle↔grid 传输对照。
   一团粒子绕中心旋转：PIC 角动量丢失、迅速糊成一团（耗散）；FLIP 保能量但抖动/噪声；
   APIC 携带仿射场 C_p，既保角动量又不糊。看每种方案下旋转团随步数的「保形 vs 耗散 vs 噪声」。 */
(function () {
  window.VBWidgets["transfer-apic"] = function (root) {
    const W = 560, H = 300; const c = (n) => VBW.c(n);
    const st = { mode: "apic", step: 0 };
    const cx = W / 2, cy = 150, R0 = 70, N = 28;
    const rng = VBW.rng(7);
    // 初始：圆环上的粒子 + 各自的“误差状态”
    let parts = [];
    function reset() {
      parts = []; const rr = VBW.rng(7);
      for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; parts.push({ a, r: R0, blur: 0, noise: 0 }); }
      st.step = 0;
    }
    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function advance() {
      st.step++;
      parts.forEach((p, i) => {
        p.a += 0.18; // 旋转
        if (st.mode === "pic") { p.blur += 1.6; p.r = R0 - p.blur * 0.9; }          // 耗散：半径塌缩
        else if (st.mode === "flip") { p.noise = (((i * 9301 + st.step * 49297) % 233280) / 233280 - 0.5) * 14; } // 噪声抖动
        else { p.blur = 0; p.noise = 0; }                                            // APIC：保形
      });
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      // 中心 + 旋转指示
      ctx.strokeStyle = c("border"); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(cx, cy, R0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      parts.forEach((p) => {
        const r = Math.max(6, p.r) + (p.noise || 0);
        const x = cx + Math.cos(p.a) * r, y = cy + Math.sin(p.a) * r;
        ctx.fillStyle = c("interactive"); ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
      });
      ctx.fillStyle = c("ink"); ctx.font = "13px var(--mono)";
      const label = { pic: "PIC：角动量流失 → 旋转团迅速塌缩、糊成一坨（极度耗散）", flip: "FLIP：保住能量，但每步抖动 → 噪声、易不稳", apic: "APIC：携带仿射场 Cₚ → 既保角动量又不糊（现代默认）" }[st.mode];
      ctx.fillText("步数 " + st.step, 20, 28);
      ctx.fillStyle = c("ink-soft"); ctx.font = "11px var(--mono)";
      let line = "", yy = H - 18; label.split("").forEach((ch) => { if (ctx.measureText(line + ch).width > W - 40) { ctx.fillText(line, 20, yy - 16); line = ch; } else line += ch; }); ctx.fillText(line, 20, yy);
    }
    const r1 = VBW.row();
    r1.appendChild(VBW.seg([{ label: "PIC", value: "pic" }, { label: "FLIP", value: "flip" }, { label: "APIC", value: "apic" }], st.mode, (v) => { st.mode = v; reset(); draw(); }));
    const r2 = VBW.row();
    const mk = (t, f) => { const b = VBW.el("button", null, t); b.style.cssText = "margin-right:8px;padding:6px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--ink);cursor:pointer;font:13px var(--mono)"; b.addEventListener("click", f); return b; };
    r2.appendChild(mk("转一步 ▶", advance)); r2.appendChild(mk("重置", () => { reset(); draw(); }));
    root.appendChild(cv); root.appendChild(r1); root.appendChild(r2);
    root.appendChild(VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "让一团粒子绕中心旋转，反复 P2G→G2P。切 PIC/FLIP/APIC 各转几步：PIC 把旋转能量耗散光、团塌缩；FLIP 保能量但满是噪声抖动；APIC 传一个仿射速度场 Cₚ，既守住角动量又不糊——这就是它成为现代 MPM 默认传输的原因。"));
    window.addEventListener("themechange", draw); reset(); draw();
  };
})();
