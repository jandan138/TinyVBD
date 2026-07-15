/* triangle-mass — P1 consistent mass, row-sum lumping, and their kinetic forms. */
(function () {
  function positiveMass(totalMass) {
    if (!Number.isFinite(totalMass) || totalMass <= 0) {
      throw new RangeError("Triangle total mass must be a positive finite number");
    }
  }

  function finiteEntries(values, expectedLength, name) {
    if (!values || values.length !== expectedLength || !Array.from(values).every(Number.isFinite)) {
      throw new TypeError(name + " must contain exactly " + expectedLength + " finite entries");
    }
  }

  function triangleConsistentMass(totalMass) {
    positiveMass(totalMass);
    const scale = totalMass / 12;
    return [
      2 * scale, scale, scale,
      scale, 2 * scale, scale,
      scale, scale, 2 * scale,
    ];
  }

  function matrixRowSums(matrix, size) {
    if (!Number.isSafeInteger(size) || size <= 0) {
      throw new RangeError("Matrix size must be a positive integer");
    }
    finiteEntries(matrix, size * size, "Matrix for a " + size + " x " + size + " row sum");
    const sums = new Array(size).fill(0);
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) sums[row] += matrix[row * size + col];
    }
    return sums;
  }

  function triangleLumpedMass(totalMass) {
    positiveMass(totalMass);
    const share = totalMass / 3;
    return [share, 0, 0, 0, share, 0, 0, 0, share];
  }

  function triangleP2RowSumMasses(totalMass) {
    positiveMass(totalMass);
    return [0, 0, 0, totalMass / 3, totalMass / 3, totalMass / 3];
  }

  function quadraticForm(matrix, vector) {
    if (!vector || !Number.isSafeInteger(vector.length) || vector.length <= 0) {
      throw new TypeError("Quadratic-form vector must contain finite entries");
    }
    const size = vector.length;
    finiteEntries(vector, size, "Quadratic-form vector");
    finiteEntries(matrix, size * size, "Matrix for a " + size + " x " + size + " quadratic form");
    let value = 0;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        value += vector[row] * matrix[row * size + col] * vector[col];
      }
    }
    if (!Number.isFinite(value)) throw new RangeError("Quadratic form overflowed");
    return value;
  }

  window.VBW.triangleConsistentMass = triangleConsistentMass;
  window.VBW.matrixRowSums = matrixRowSums;
  window.VBW.triangleLumpedMass = triangleLumpedMass;
  window.VBW.triangleP2RowSumMasses = triangleP2RowSumMasses;
  window.VBW.quadraticForm = quadraticForm;

  window.VBWidgets["triangle-mass"] = function (root) {
    const maxWidth = 620;
    let W = 0, H = 0;
    let points = [];
    let totalMass = 12;
    let velocities = [1, 1, 1];

    const controls = VBW.row();
    const massSlider = VBW.slider("单元总质量", 3, 30, 1, totalMass, (value) => {
      totalMass = value;
      draw();
    }, (value) => value.toFixed(0));
    controls.appendChild(massSlider.wrap);
    let presetControl;
    function clearPreset() {
      [...presetControl.children].forEach((button) => button.classList.remove("on"));
    }
    const velocitySliders = velocities.map((velocity, index) => {
      const slider = VBW.slider(`节点 ${index + 1} 速度`, -2, 2, 0.1, velocity, (value) => {
        velocities[index] = value;
        clearPreset();
        draw();
      }, (value) => value.toFixed(1));
      controls.appendChild(slider.wrap);
      return slider;
    });
    presetControl = VBW.seg([
      { label: "常速度", value: "constant" },
      { label: "交替速度", value: "alternating" },
      { label: "单点速度", value: "single" },
    ], "constant", (preset) => {
      velocities = preset === "alternating" ? [1, -1, 0] : preset === "single" ? [1, 0, 0] : [1, 1, 1];
      velocitySliders.forEach((slider, index) => slider.setVal(velocities[index]));
      draw();
    });
    controls.appendChild(presetControl);

    const canvas = VBW.el("canvas", { "aria-label": "三角形 consistent 与 lumped 质量对比" });
    const ctx = canvas.getContext("2d");
    canvas.style.cssText =
      "width:100%;max-width:100%;margin:auto;background:var(--surface-2);border-radius:10px";
    const panel = VBW.el("div", {
      "aria-live": "polite",
      style: "font-family:var(--mono);font-size:.75rem;color:var(--ink-soft);margin-top:10px;line-height:1.75;overflow-x:auto",
    });

    function resize() {
      const rootStyle = getComputedStyle(root);
      const padding = (parseFloat(rootStyle.paddingLeft) || 0) + (parseFloat(rootStyle.paddingRight) || 0);
      const contentWidth = root.clientWidth - padding;
      const available = Number.isFinite(contentWidth) && contentWidth > 0 ? contentWidth : maxWidth;
      const width = Math.max(1, Math.min(maxWidth, Math.floor(available)));
      const height = width < 420 ? 285 : 255;
      if (width === W && height === H) return;
      W = width;
      H = height;
      points = [
        { x: 0.19 * W, y: H - 50 },
        { x: 0.81 * W, y: H - 50 },
        { x: 0.36 * W, y: 42 },
      ];
      VBW.hidpi(canvas, ctx, W, H);
      draw();
    }

    function color(name, fallback) {
      return VBW.c(name) || fallback;
    }

    function arrow(x, y, value, stroke) {
      const length = value * 30;
      ctx.strokeStyle = stroke;
      ctx.fillStyle = stroke;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - length); ctx.stroke();
      const sign = value >= 0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(x, y - length);
      ctx.lineTo(x - 5, y - length - sign * 9);
      ctx.lineTo(x + 5, y - length - sign * 9);
      ctx.closePath(); ctx.fill();
    }

    function matrixHtml(matrix) {
      const rows = [];
      for (let row = 0; row < 3; row++) {
        rows.push(`[${matrix.slice(row * 3, row * 3 + 3).map((v) => v.toFixed(2)).join(", ")}]`);
      }
      return rows.join(" ");
    }

    function draw() {
      const consistent = triangleConsistentMass(totalMass);
      const lumped = triangleLumpedMass(totalMass);
      const diagonalOnly = [consistent[0], 0, 0, 0, consistent[4], 0, 0, 0, consistent[8]];
      const qc = quadraticForm(consistent, velocities);
      const ql = quadraticForm(lumped, velocities);
      const qd = quadraticForm(diagonalOnly, velocities);
      const tc = 0.5 * qc, tl = 0.5 * ql, td = 0.5 * qd;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = color("interactive-soft", "#e1f5f2");
      ctx.strokeStyle = color("interactive", "#0d9488");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.lineTo(points[2].x, points[2].y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      points.forEach((point, index) => {
        arrow(point.x, point.y - 7, velocities[index], color("accent", "#4338ca"));
        ctx.fillStyle = color("surface", "#fff");
        ctx.strokeStyle = color("ink", "#191b22");
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(point.x, point.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = color("ink", "#191b22");
        ctx.font = "12px monospace";
        ctx.fillText(`v${index + 1}=${velocities[index].toFixed(1)}`, point.x + 10, point.y + 5);
      });

      ctx.fillStyle = color("ink-soft", "#545968");
      ctx.font = "12px sans-serif";
      ctx.fillText(
        W < 420 ? "箭头是一维速度；常速度时两种动能相同。" : "箭头表示一个标量速度分量；三个都相等时，两种质量给出同一动能。",
        W < 420 ? 12 : 24,
        H - 16
      );

      const equal = Math.max(...velocities) - Math.min(...velocities) < 1e-10;
      panel.innerHTML =
        `M_consistent = ${matrixHtml(consistent)}<br>` +
        `M_lumped = ${matrixHtml(lumped)} &nbsp; row sums = ` +
        `[${matrixRowSums(consistent, 3).map((v) => v.toFixed(2)).join(", ")}]<br>` +
        `q^T M q: consistent=${qc.toFixed(3)}, lumped=${ql.toFixed(3)}, 只取原对角=${qd.toFixed(3)}<br>` +
        `T = 1/2 q^T M q: consistent=<b style="color:var(--interactive)">${tc.toFixed(3)}</b> &nbsp; ` +
        `lumped=<b style="color:var(--accent)">${tl.toFixed(3)}</b> &nbsp; ` +
        `只取原对角=<b style="color:var(--warn)">${td.toFixed(3)}</b><br>` +
        (equal
          ? `<span style="color:var(--interactive)">常速度：consistent 与 row-sum lumped 完全一致。</span>`
          : "一般速度场：非对角交叉动能被 lumping 改写，因此两者通常不同。") +
        `<br>P2 朴素行和（顶点 1,2,3 | 边中点 12,23,31）= ` +
        `[${triangleP2RowSumMasses(totalMass).map((v) => v.toFixed(1)).join(", ")}]`;
    }

    root.appendChild(controls);
    root.appendChild(canvas);
    root.appendChild(panel);
    window.addEventListener("themechange", draw);
    resize();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(resize);
      observer.observe(root);
      root._vbwTriangleMassResizeObserver = observer;
    } else {
      window.addEventListener("resize", resize);
    }
  };
})();
