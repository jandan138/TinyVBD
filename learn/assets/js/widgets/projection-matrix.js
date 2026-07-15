/* projection-matrix — orthogonal projectors and the spring Hessian they build. */
(function () {
  function finiteVector2(value, name) {
    if (!value || value.length !== 2 || !Number.isFinite(value[0]) || !Number.isFinite(value[1])) {
      throw new TypeError(name + " must be a finite 2-vector");
    }
    return [value[0], value[1]];
  }

  function springParameters(stiffness, restLength) {
    if (!Number.isFinite(stiffness) || stiffness <= 0) {
      throw new RangeError("Spring stiffness must be a positive finite number");
    }
    if (!Number.isFinite(restLength) || restLength < 0) {
      throw new RangeError("Spring rest length must be a finite nonnegative number");
    }
  }

  function normalize2(v) {
    const finite = finiteVector2(v, "Projection direction");
    const scale = Math.max(Math.abs(finite[0]), Math.abs(finite[1]));
    if (!(scale > 0)) throw new Error("Projection direction must be nonzero");
    const x = finite[0] / scale, y = finite[1] / scale;
    const length = Math.hypot(x, y);
    return [x / length, y / length];
  }

  function projectVector(direction, vector) {
    const n = normalize2(direction);
    const v = finiteVector2(vector, "Projected vector");
    const nx = n[0], ny = n[1];
    const parallelMatrix = [nx * nx, nx * ny, nx * ny, ny * ny];
    const perpendicularMatrix = [ny * ny, -nx * ny, -nx * ny, nx * nx];
    const apply = (matrix) => [
      matrix[0] * v[0] + matrix[1] * v[1],
      matrix[2] * v[0] + matrix[3] * v[1],
    ];
    return {
      direction: n,
      parallelMatrix,
      perpendicularMatrix,
      parallel: apply(parallelMatrix),
      perpendicular: apply(perpendicularMatrix),
    };
  }

  function springEnergy2D(d, stiffness, restLength) {
    const displacement = finiteVector2(d, "Spring displacement");
    springParameters(stiffness, restLength);
    const length = Math.hypot(displacement[0], displacement[1]);
    const stretch = length - restLength;
    const energy = 0.5 * stiffness * stretch * stretch;
    if (!Number.isFinite(energy)) throw new RangeError("Spring energy overflowed");
    return energy;
  }

  function springHessian2D(d, stiffness, restLength) {
    const displacement = finiteVector2(d, "Spring displacement");
    springParameters(stiffness, restLength);
    if (restLength === 0) return [stiffness, 0, 0, stiffness];

    const length = Math.hypot(displacement[0], displacement[1]);
    if (!Number.isFinite(length)) throw new RangeError("Spring length overflowed");
    if (length === 0) {
      throw new Error("Spring Hessian is undefined at zero length when rest length is positive");
    }
    const projection = projectVector(displacement, [0, 0]);
    const transverse = stiffness * (1 - restLength / length);
    const hessian = projection.parallelMatrix.map(
      (value, i) => stiffness * value + transverse * projection.perpendicularMatrix[i]
    );
    if (!hessian.every(Number.isFinite)) throw new RangeError("Spring Hessian overflowed near zero length");
    return hessian;
  }

  window.VBW.projectVector = projectVector;
  window.VBW.springEnergy2D = springEnergy2D;
  window.VBW.springHessian2D = springHessian2D;

  window.VBWidgets["projection-matrix"] = function (root) {
    const maxWidth = 620;
    let W = 0, H = 0;
    let center = { x: 250, y: 176 };
    let scale = 82;
    let direction = [3 / 5, 4 / 5];
    let vector = [2, 1];
    let dragging = null;
    let activePointerId = null;

    const controls = VBW.row();
    let presetControl;
    function clearPreset() {
      [...presetControl.children].forEach((button) => button.classList.remove("on"));
    }
    presetControl = VBW.seg([
      { label: "正文例子", value: "example" },
      { label: "v 平行 u", value: "parallel" },
      { label: "v 垂直 u", value: "perpendicular" },
      { label: "零向量", value: "zero" },
    ], "example", (preset) => {
      if (preset === "example") {
        direction = [3 / 5, 4 / 5]; vector = [2, 1];
      } else if (preset === "parallel") {
        vector = [1.5 * direction[0], 1.5 * direction[1]];
      } else if (preset === "perpendicular") {
        vector = [-1.5 * direction[1], 1.5 * direction[0]];
      } else {
        vector = [0, 0];
      }
      draw();
    });
    controls.appendChild(presetControl);

    const canvas = VBW.el("canvas", { "aria-label": "投影矩阵向量分解交互图" });
    const ctx = canvas.getContext("2d");
    canvas.style.cssText =
      "width:100%;max-width:100%;margin:auto;background:var(--surface-2);" +
      "border-radius:10px;touch-action:pan-y;cursor:grab";
    const panel = VBW.el("div", {
      "aria-live": "polite",
      style: "font-family:var(--mono);font-size:.76rem;color:var(--ink-soft);margin-top:10px;line-height:1.7;overflow-x:auto",
    });

    function resize() {
      const rootStyle = getComputedStyle(root);
      const padding = (parseFloat(rootStyle.paddingLeft) || 0) + (parseFloat(rootStyle.paddingRight) || 0);
      const contentWidth = root.clientWidth - padding;
      const available = Number.isFinite(contentWidth) && contentWidth > 0 ? contentWidth : maxWidth;
      const width = Math.max(1, Math.min(maxWidth, Math.floor(available)));
      const height = width < 420 ? 320 : 350;
      if (width === W && height === H) return;
      W = width;
      H = height;
      center = { x: width >= 520 ? 250 : width / 2, y: height / 2 };
      scale = Math.min(82, Math.max(24, (width - 54) / 5.1));
      VBW.hidpi(canvas, ctx, W, H);
      draw();
    }

    function color(name, fallback) {
      return VBW.c(name) || fallback;
    }

    function screen(v) {
      return { x: center.x + scale * v[0], y: center.y - scale * v[1] };
    }

    function world(x, y) {
      return [(x - center.x) / scale, (center.y - y) / scale];
    }

    function arrow(from, to, stroke, width, label) {
      const dx = to.x - from.x, dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const ux = dx / length, uy = dy / length;
      ctx.strokeStyle = stroke;
      ctx.fillStyle = stroke;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - 10 * ux + 5 * uy, to.y - 10 * uy - 5 * ux);
      ctx.lineTo(to.x - 10 * ux - 5 * uy, to.y - 10 * uy + 5 * ux);
      ctx.closePath();
      ctx.fill();
      if (label) {
        ctx.font = "12px monospace";
        ctx.fillText(label, to.x + 8, to.y - 7);
      }
    }

    function matrixHtml(matrix) {
      return `[[${matrix[0].toFixed(3)}, ${matrix[1].toFixed(3)}], ` +
        `[${matrix[2].toFixed(3)}, ${matrix[3].toFixed(3)}]]`;
    }

    function draw() {
      const result = projectVector(direction, vector);
      direction = result.direction;
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = color("border-strong", "#ccd0df");
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, center.y); ctx.lineTo(W - 20, center.y);
      ctx.moveTo(center.x, 20); ctx.lineTo(center.x, H - 20);
      ctx.stroke();

      const nEnd = screen([direction[0] * 2.25, direction[1] * 2.25]);
      const nBack = screen([-direction[0] * 2.25, -direction[1] * 2.25]);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = color("accent", "#4338ca");
      ctx.beginPath(); ctx.moveTo(nBack.x, nBack.y); ctx.lineTo(nEnd.x, nEnd.y); ctx.stroke();
      ctx.setLineDash([]);

      const vEnd = screen(vector);
      const parallelEnd = screen(result.parallel);
      const perpendicularEnd = screen(result.perpendicular);
      const parallelThenPerp = {
        x: parallelEnd.x + (perpendicularEnd.x - center.x),
        y: parallelEnd.y + (perpendicularEnd.y - center.y),
      };

      arrow(center, parallelEnd, color("interactive", "#0d9488"), 3, "Pi_parallel v");
      arrow(center, perpendicularEnd, color("warn", "#b45309"), 3, "Pi_perp v");
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = color("ink-faint", "#888da0");
      ctx.beginPath();
      ctx.moveTo(parallelEnd.x, parallelEnd.y); ctx.lineTo(parallelThenPerp.x, parallelThenPerp.y);
      ctx.moveTo(perpendicularEnd.x, perpendicularEnd.y); ctx.lineTo(parallelThenPerp.x, parallelThenPerp.y);
      ctx.stroke();
      ctx.setLineDash([]);
      arrow(center, vEnd, color("ink", "#191b22"), 2.5, "v");
      arrow(center, screen(direction), color("accent", "#4338ca"), 3.5, "u");

      for (const point of [screen(direction), vEnd]) {
        ctx.fillStyle = color("surface", "#fff");
        ctx.strokeStyle = point === vEnd ? color("ink", "#191b22") : color("accent", "#4338ca");
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(point.x, point.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      ctx.fillStyle = color("ink-faint", "#888da0");
      ctx.font = "12px sans-serif";
      ctx.fillText(W < 420 ? "拖动端点，或使用上方预设" : "拖动蓝色 u 或黑色 v 端点，移动端也可使用预设", 18, H - 14);

      const dot = result.parallel[0] * result.perpendicular[0] +
        result.parallel[1] * result.perpendicular[1];
      panel.innerHTML =
        `<b style="color:var(--accent)">u</b> = (${direction[0].toFixed(3)}, ${direction[1].toFixed(3)}) &nbsp; ` +
        `<b>v</b> = (${vector[0].toFixed(3)}, ${vector[1].toFixed(3)})<br>` +
        `Pi_parallel = ${matrixHtml(result.parallelMatrix)}<br>` +
        `Pi_perp = ${matrixHtml(result.perpendicularMatrix)}<br>` +
        `<span style="color:var(--interactive)">parallel</span> = (${result.parallel[0].toFixed(3)}, ${result.parallel[1].toFixed(3)}) &nbsp; ` +
        `<span style="color:var(--warn)">perpendicular</span> = (${result.perpendicular[0].toFixed(3)}, ${result.perpendicular[1].toFixed(3)})<br>` +
        `sum = (${(result.parallel[0] + result.perpendicular[0]).toFixed(3)}, ` +
        `${(result.parallel[1] + result.perpendicular[1]).toFixed(3)}) &nbsp; dot = ${dot.toExponential(1)}`;
    }

    function pointerPosition(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * W / rect.width,
        y: (event.clientY - rect.top) * H / rect.height,
      };
    }

    canvas.addEventListener("pointerdown", (event) => {
      if (activePointerId !== null) return;
      const p = pointerPosition(event);
      const uEnd = screen(direction), vEnd = screen(vector);
      const du = Math.hypot(p.x - uEnd.x, p.y - uEnd.y);
      const dv = Math.hypot(p.x - vEnd.x, p.y - vEnd.y);
      if (Math.min(du, dv) > 26) return;
      dragging = du < dv ? "direction" : "vector";
      activePointerId = event.pointerId;
      if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      const p = pointerPosition(event);
      const value = world(p.x, p.y);
      if (dragging === "direction") {
        if (Math.hypot(value[0], value[1]) > 0.12) direction = normalize2(value);
      } else {
        const length = Math.hypot(value[0], value[1]);
        const factor = length > 2.55 ? 2.55 / length : 1;
        vector = [value[0] * factor, value[1] * factor];
      }
      clearPreset();
      draw();
    });
    function release(event) {
      if (event.pointerId !== activePointerId) return;
      dragging = null;
      activePointerId = null;
      if (canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      canvas.style.cursor = "grab";
    }
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("lostpointercapture", release);
    window.addEventListener("themechange", draw);
    root.appendChild(controls);
    root.appendChild(canvas);
    root.appendChild(panel);
    resize();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(resize);
      observer.observe(root);
      root._vbwProjectionResizeObserver = observer;
    } else {
      window.addEventListener("resize", resize);
    }
  };
})();
