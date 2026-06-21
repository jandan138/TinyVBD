/* state-ping-pong — 7-3 Model/State 双缓冲 ping-pong：solver.step(state_in, state_out) 后交换。
   两个 State 缓冲 A/B，每帧从 in 读、往 out 写、再 swap 指针。对照 "in-place 单缓冲" 看为什么要两个。
   单步推进看 in/out 指针怎么交替；toggle 切 explicit(双缓冲) vs in-place(单缓冲，TinyVBD 那样)。 */
(function () {
  window.VBWidgets["state-ping-pong"] = function (root) {
    const W = 560, H = 280; const c = (n) => VBW.c(n);
    const state = { frame: 0, inIsA: true, doubleBuf: true };

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const aX = 110, bX = 380, bufY = 70, bw = 120, bh = 90;
      const inBuf = state.doubleBuf ? (state.inIsA ? "A" : "B") : "A";
      const outBuf = state.doubleBuf ? (state.inIsA ? "B" : "A") : "A";

      function buffer(x, name) {
        const isIn = name === inBuf, isOut = name === outBuf;
        ctx.fillStyle = "var(--surface-3)";
        ctx.strokeStyle = isIn ? c("interactive") : (isOut ? (c("accent") || "#6b5bd6") : c("border"));
        ctx.lineWidth = (isIn || isOut) ? 2.5 : 1;
        ctx.fillStyle = "rgba(120,120,140,.06)"; ctx.fillRect(x, bufY, bw, bh); ctx.strokeRect(x, bufY, bw, bh);
        ctx.fillStyle = c("ink"); ctx.font = "bold 14px var(--mono)"; ctx.fillText("State " + name, x + 30, bufY + 24);
        ctx.font = "11px var(--mono)"; ctx.fillStyle = c("ink-faint");
        ctx.fillText("particle_q", x + 14, bufY + 48); ctx.fillText("particle_qd", x + 14, bufY + 64); ctx.fillText("particle_f", x + 14, bufY + 80);
        // 角标
        if (isIn) { ctx.fillStyle = c("interactive"); ctx.font = "11px var(--mono)"; ctx.fillText("◀ state_in (读)", x + 2, bufY - 8); }
        if (isOut && state.doubleBuf) { ctx.fillStyle = c("accent") || "#6b5bd6"; ctx.font = "11px var(--mono)"; ctx.fillText("state_out (写) ▶", x + 12, bufY + bh + 18); }
      }
      buffer(aX, "A");
      if (state.doubleBuf) buffer(bX, "B");
      else { ctx.fillStyle = c("ink-faint"); ctx.font = "12px var(--mono)"; ctx.fillText("（单缓冲：就地读写同一个 A）", bX - 10, bufY + bh / 2); ctx.fillText("↩ in-place", bX + 20, bufY + bh / 2 + 20); }

      // solver 箭头
      ctx.strokeStyle = c("ink-soft"); ctx.lineWidth = 2;
      if (state.doubleBuf) {
        const fromX = (inBuf === "A" ? aX + bw : bX + bw), toX = (outBuf === "A" ? aX : bX);
        const y = bufY + bh / 2;
        ctx.beginPath(); ctx.moveTo(aX + bw + 6, y); ctx.lineTo(bX - 6, y); ctx.stroke();
        ctx.fillStyle = c("ink-soft"); ctx.font = "12px var(--mono)";
        ctx.fillText("solver.step(in → out)", aX + bw + 24, y - 8);
        // swap 提示
        ctx.fillStyle = c("warn"); ctx.fillText("⇄ swap 指针", W / 2 - 36, bufY + bh + 40);
      }

      // 帧计数 + 序列
      ctx.fillStyle = c("ink"); ctx.font = "13px var(--mono)";
      ctx.fillText("frame " + state.frame + (state.doubleBuf ? `：读 ${inBuf} → 写 ${outBuf} → swap` : "：就地更新 A"), 30, 30);
      ctx.fillStyle = c("ink-faint"); ctx.font = "11px var(--mono)";
      ctx.fillText(state.doubleBuf
        ? "双缓冲：上一帧结果完整保留在 in 里，整帧读旧写新——并行 kernel 不会读到半更新的数据。"
        : "单缓冲（TinyVBD strand 那样）：就地改 A。串行没问题，但 GPU 并行下会读到别人刚写的半成品。", 30, H - 16);
    }

    const r1 = VBW.row();
    const mk = (t, f) => { const b = VBW.el("button", null, t); b.style.cssText = "margin-right:8px;padding:6px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--ink);cursor:pointer;font:13px var(--mono)"; b.addEventListener("click", f); return b; };
    r1.appendChild(mk("下一帧 ▶", () => { state.frame++; if (state.doubleBuf) state.inIsA = !state.inIsA; draw(); }));
    r1.appendChild(mk("重置", () => { state.frame = 0; state.inIsA = true; draw(); }));
    const r2 = VBW.row();
    r2.appendChild(VBW.toggle("双缓冲 (Newton)", state.doubleBuf, (v) => { state.doubleBuf = v; state.frame = 0; state.inIsA = true; draw(); }));
    root.appendChild(cv); root.appendChild(r1); root.appendChild(r2);
    const cap = VBW.el("div", { class: "lab-cap", style: "padding:6px 0 0" }, "点「下一帧」：双缓冲下 solver 从 state_in 读、往 state_out 写，然后交换指针——下一帧角色互换。关掉双缓冲看 TinyVBD 那样的就地单缓冲：串行可以，但 GPU 并行会读到半更新数据。这就是 Newton 为什么要两个 State。");
    root.appendChild(cap);
    window.addEventListener("themechange", draw);
    draw();
  };
})();
