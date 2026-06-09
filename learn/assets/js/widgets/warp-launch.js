/* warp-launch — SPMD 心智模型小可视化。一个 wp.launch(kernel, dim=N) 启动 N 个 thread，
   每个 thread 用 tid=wp.tid() 取自己那一份数据，互不干扰。点一个格子看它的 tid 与读写的元素。 */
(function () {
  window.VBWidgets["warp-launch"] = function (root) {
    const N = 16, cols = 8;
    const c = (n) => VBW.c(n);
    let active = -1;
    const grid = VBW.el("div", { style: "display:grid;grid-template-columns:repeat(" + cols + ",1fr);gap:6px;margin:auto;max-width:520px" });
    const cells = [];
    for (let i = 0; i < N; i++) {
      const cell = VBW.el("div", { style: "aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:.8rem;cursor:pointer;background:var(--surface-2);border:1px solid var(--border)" }, String(i));
      cell.addEventListener("click", () => { active = i; render(); });
      cells.push(cell); grid.appendChild(cell);
    }
    const info = VBW.el("div", { class: "lab-cap" });
    function render() {
      cells.forEach((cell, i) => {
        const on = i === active;
        cell.style.background = on ? "var(--interactive)" : "var(--surface-2)";
        cell.style.color = on ? "#fff" : "var(--ink-soft)";
        cell.style.borderColor = on ? "var(--interactive)" : "var(--border)";
      });
      info.innerHTML = active < 0
        ? "<code>wp.launch(kernel, dim=" + N + ")</code> 启动 " + N + " 个 thread。点一个格子看它做什么。"
        : "thread <b>tid=" + active + "</b> 执行 <code>x[" + active + "] = f(x[" + active + "])</code> —— 只碰自己那份数据，和其它 " + (N - 1) + " 个 thread 并行。";
    }
    root.appendChild(grid); root.appendChild(info); render();
  };
})();
