/* contract-ladder — 物理合同三层梯子：几何 / drive·mimic / 接触求解 */
(function () {
  window.VBWidgets["contract-ladder"] = function (root) {
    const layers = [
      {
        id: "geo",
        title: "1 · 碰撞几何",
        proven: "形状近似是否一致（凸包 vs 三角网格）",
        not: "还不能证明夹得住；只说明接触点可能一开始就不一样",
      },
      {
        id: "drive",
        title: "2 · Drive / Mimic 拓扑",
        proven: "谁主动、谁被动、力限是否存在",
        not: "拓扑对齐 ≠ 接触响应已联合求解",
      },
      {
        id: "contact",
        title: "3 · 接触 / 摩擦求解结构",
        proven: "冲量是否同一次谈妥，还是顺序投影互相覆盖",
        not: "偶发终态成功不能代替结构门禁",
      },
    ];
    let active = 0;
    const wrap = VBW.el("div", { class: "ctrl", style: "padding:8px 4px" });
    const buttons = VBW.row();
    const body = VBW.el("div", {
      style: "margin-top:10px;padding:12px 14px;border-radius:10px;background:var(--surface-2);min-height:110px",
    });

    function render() {
      body.innerHTML = "";
      const L = layers[active];
      body.appendChild(VBW.el("div", { style: "font-weight:600;margin-bottom:8px" }, L.title));
      body.appendChild(VBW.el("p", { style: "margin:0 0 6px;font-size:13px" },
        "<b>这一层能证明：</b>" + L.proven));
      body.appendChild(VBW.el("p", { style: "margin:0;font-size:13px;opacity:.85" },
        "<b>还不能证明：</b>" + L.not));
      [...buttons.children].forEach((b, i) => b.classList.toggle("on", i === active));
    }

    layers.forEach((L, i) => {
      const b = VBW.el("button", i === 0 ? { class: "on" } : null, L.title.split("·")[0].trim());
      b.addEventListener("click", () => { active = i; render(); });
      buttons.appendChild(b);
    });
    buttons.className = "seg";
    wrap.appendChild(buttons);
    wrap.appendChild(body);
    root.appendChild(wrap);
    render();
  };
})();
