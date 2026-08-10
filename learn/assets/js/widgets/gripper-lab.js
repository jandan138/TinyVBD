/* gripper-lab — 迷你双指夹块：顺序 XPBD vs 联合求解 */
(function () {
  window.VBWidgets["gripper-lab"] = function (root) {
    if (!window.VBW || !window.VBW.GripperCore) {
      root.appendChild(VBW.el("div", null, "gripper-core.js 未加载"));
      return;
    }
    const W = 560, H = 300;
    const cfg = {
      mode: "sequential", mu: 0.85, fMax: 1.0,
      mimicOn: true, forceLimitOn: true,
    };
    let g = new VBW.GripperCore(cfg);
    let running = true;

    const cv = VBW.el("canvas"); const ctx = cv.getContext("2d");
    VBW.hidpi(cv, ctx, W, H);
    cv.style.cssText = "width:100%;max-width:" + W + "px;margin:auto;display:block;background:var(--surface-2);border-radius:10px";

    const read = VBW.el("div", {
      style: "font:12px var(--mono);margin:8px 0;opacity:.9",
    });

    function rebuild(reset) {
      const y = reset ? 0 : g.yO;
      g = new VBW.GripperCore(cfg);
      if (!reset) g.yO = y;
    }

    function draw() {
      const s = g.snapshot();
      ctx.clearRect(0, 0, W, H);
      const mapX = (q) => 280 + q * 480;
      const mapY = (y) => 210 - y * 420;
      // table
      ctx.strokeStyle = VBW.c("ink-soft"); ctx.beginPath();
      ctx.moveTo(40, mapY(0)); ctx.lineTo(520, mapY(0)); ctx.stroke();
      // object
      ctx.fillStyle = VBW.c("accent") || "#6b5bd6"; ctx.globalAlpha = 0.45;
      const x0 = mapX(s.xO - g.halfW), x1 = mapX(s.xO + g.halfW);
      const y1 = mapY(s.yO), y0 = mapY(s.yO + 0.16);
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.globalAlpha = 1;
      // jaws
      ctx.fillStyle = VBW.c("interactive");
      ctx.fillRect(mapX(s.qL) - 8, mapY(s.yO + 0.2), 16, 90);
      ctx.fillRect(mapX(s.qR) - 8, mapY(s.yO + 0.2), 16, 90);
      ctx.fillStyle = VBW.c("ink"); ctx.font = "12px var(--mono)";
      ctx.fillText(cfg.mode === "coupled" ? "Coupled" : "Sequential XPBD", 20, 24);
      ctx.fillText(s.lifted ? "状态：抬起" : (s.hold ? "状态：夹持中" : "状态：未夹稳"), 20, 42);
      read.textContent =
        "gap=" + s.gap.toFixed(3) +
        "  nL/nR=" + s.nL.toFixed(2) + "/" + s.nR.toFixed(2) +
        "  fric=" + s.fric.toFixed(2) +
        "  y=" + s.yO.toFixed(3) +
        "  μ=" + cfg.mu.toFixed(2) +
        "  fmax=" + cfg.fMax.toFixed(2);
    }

    function tick() {
      if (running) g.step();
      draw();
      requestAnimationFrame(tick);
    }

    const r0 = VBW.row();
    r0.appendChild(VBW.seg(
      [{ label: "Sequential", value: "sequential" }, { label: "Coupled", value: "coupled" }],
      cfg.mode,
      (v) => { cfg.mode = v; rebuild(true); }
    ));
    r0.appendChild(VBW.seg(
      [{ label: "μ 开", value: true }, { label: "μ=0", value: false }],
      true,
      (v) => { cfg.mu = v ? 0.85 : 0; rebuild(true); }
    ));

    const r1 = VBW.row();
    r1.appendChild(VBW.seg(
      [{ label: "力限开", value: true }, { label: "力限关", value: false }],
      true,
      (v) => { cfg.forceLimitOn = v; rebuild(true); }
    ));
    r1.appendChild(VBW.seg(
      [{ label: "mimic 开", value: true }, { label: "mimic 关", value: false }],
      true,
      (v) => { cfg.mimicOn = v; rebuild(true); }
    ));

    const r2 = VBW.row();
    function preset(label, fn) {
      const b = VBW.el("button", null, label);
      b.addEventListener("click", () => { fn(); rebuild(true); });
      return b;
    }
    const presets = VBW.el("div", { class: "seg" });
    presets.appendChild(preset("夹不住（顺序）", () => { cfg.mode = "sequential"; cfg.mu = 0.85; cfg.mimicOn = true; cfg.forceLimitOn = true; }));
    presets.appendChild(preset("夹住（联合）", () => { cfg.mode = "coupled"; cfg.mu = 0.85; cfg.mimicOn = true; cfg.forceLimitOn = true; }));
    presets.appendChild(preset("零摩擦应失败", () => { cfg.mode = "coupled"; cfg.mu = 0; cfg.mimicOn = true; cfg.forceLimitOn = true; }));
    r2.appendChild(presets);

    root.appendChild(cv);
    root.appendChild(read);
    root.appendChild(r0); root.appendChild(r1); root.appendChild(r2);
    window.addEventListener("themechange", draw);
    tick();
  };
})();
