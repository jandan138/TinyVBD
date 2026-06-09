/*
 * content.js — 导航单一真相源 (single source of truth)
 * 驱动：左侧 TOC 树、上下页导航、封面目录、客户端搜索。
 * 每个 section: { id, title, file, keywords }
 * file 路径相对于 learn/ 根目录。
 */
window.VBOOK = {
  title: "TinyVBD",
  subtitle: "从 PBD 到 Vertex Block Descent · 一本娓娓道来的交互式教程",
  parts: [
    {
      id: "p0",
      label: "Part 0",
      title: "序章 · Orientation",
      sections: [
        { id: "0-1", title: "这本书要带你去哪", file: "chapters/00-orientation/0-1-where-we-go.html",
          keywords: "vbd vertex block descent tinyvbd 序章 一句话 strand 头发 弹簧 mass spring 受众 怎么读" },
        { id: "0-2", title: "代码地图：7 个文件，一次 simulate()", file: "chapters/00-orientation/0-2-code-map.html",
          keywords: "code map 文件 main.cpp Strand.h Types.h json eigen simulate 全景 调用链 architecture" },
        { id: "0-3", title: "怎么读这本书 · 两座桥", file: "chapters/00-orientation/0-3-how-to-read.html",
          keywords: "how to read bridge games103 pbd 桥 受众 阅读指南 术语 中英文" },
      ],
    },
    {
      id: "p1",
      label: "Part 1",
      title: "数学地基 · The Variational View",
      sections: [
        { id: "1-1", title: "F=ma 与时间积分：explicit vs implicit Euler", file: "chapters/01-foundations/1-1-time-integration.html",
          keywords: "newton f=ma time integration explicit implicit euler 显式 隐式 欧拉 稳定 stability 爆炸 时间步 games103" },
        { id: "1-2", title: "隐式欧拉的变分真身：一步 = 最小化 G(x)", file: "chapters/01-foundations/1-2-variational-euler.html",
          keywords: "variational implicit euler incremental potential 最小化 optimization minimization argmin G(x) 变分 优化 数学本质 liu martin" },
        { id: "1-3", title: "惯性项 y 与弹性能：一场拔河", file: "chapters/01-foundations/1-3-inertia-elastic.html",
          keywords: "inertia 惯性 y 预测位置 inertial position 弹性能 elastic energy 拔河 tug of war 质量 mass dt 时间步" },
        { id: "1-4", title: "弹簧的能量、力与 Hessian", file: "chapters/01-foundations/1-4-spring-energy.html",
          keywords: "spring energy force hessian 弹簧 能量 力 二阶导 gradient 梯度 stiffness 刚度 rest length 弹簧质点" },
      ],
    },
    {
      id: "p2",
      label: "Part 2",
      title: "三种解法的谱系 · The Family Tree",
      sections: [
        { id: "2-1", title: "PBD：粗暴调位置的真相，与它的病", file: "chapters/02-family/2-1-pbd.html",
          keywords: "pbd position based dynamics 粗暴 调位置 constraint projection gauss seidel 迭代 stiffness 依赖 病 weakness muller 2007" },
        { id: "2-2", title: "XPBD：用 compliance 和 λ 治病", file: "chapters/02-family/2-2-xpbd.html",
          keywords: "xpbd compliance alpha lagrange multiplier lambda 柔度 治病 implicit euler macklin 2016 时间步无关" },
        { id: "2-3", title: "Projective Dynamics：local/global", file: "chapters/02-family/2-3-projective-dynamics.html",
          keywords: "projective dynamics pd local global prefactorized cholesky 全局解 投影 bouaziz 2014 liu 2013 constraint" },
        { id: "2-4", title: "谱系图：都在解同一个 min G(x)", file: "chapters/02-family/2-4-family-tree.html",
          keywords: "family tree 谱系 对比 pbd xpbd pd vbd newton gauss seidel jacobi 解法 区别 统一" },
      ],
    },
    {
      id: "p3",
      label: "Part 3",
      title: "VBD 核心思想 · Vertex Block Descent",
      sections: [
        { id: "3-1", title: "Block coordinate descent：一次只动一个顶点", file: "chapters/03-vbd/3-1-block-descent.html",
          keywords: "block coordinate descent 坐标下降 一个顶点 vertex 局部 local 3x3 块 gauss seidel sweep" },
        { id: "3-2", title: "为什么局部下降 = 全局下降", file: "chapters/03-vbd/3-2-local-global-descent.html",
          keywords: "local global descent reduction 论证 monotone energy 能量单调 收敛 convergence 证明 G_i" },
        { id: "3-3", title: "每个顶点的 3×3 牛顿步：f_i 与 H_i", file: "chapters/03-vbd/3-3-newton-step.html",
          keywords: "newton step 3x3 f_i h_i force hessian gradient 牛顿 顶点力 顶点hessian 装配 assemble adjacent" },
        { id: "3-4", title: "Gauss-Seidel、Jacobi 与 graph coloring", file: "chapters/03-vbd/3-4-coloring-parallel.html",
          keywords: "gauss seidel jacobi graph coloring 图着色 并行 parallel gpu 顶点着色 vertex color 少颜色" },
        { id: "3-5", title: "不强制 SPD：稳定性从哪来", file: "chapters/03-vbd/3-5-stability.html",
          keywords: "spd positive definite 正定 稳定性 stability 惯性项 det 阈值 skip line search 不需要 robust" },
      ],
    },
    {
      id: "p4",
      label: "Part 4",
      title: "读 TinyVBD 的代码 · Code Walkthrough",
      sections: [
        { id: "4-1", title: "数据结构：Types.h 与 Strand.h", file: "chapters/04-code/4-1-data-structures.html",
          keywords: "types.h strand.h 数据结构 eigen edges vertAdjacentEdges skip spring orgLengths mVertPos mass from" },
        { id: "4-2", title: "forwardStep()：惯性与自适应初始化", file: "chapters/04-code/4-2-forward-step.html",
          keywords: "forwardstep 惯性 inertia 自适应初始化 adaptive initialization warm start accelerationComponent gravity 预测" },
        { id: "4-3", title: "solve()：一次 Gauss-Seidel sweep 逐行解剖", file: "chapters/04-code/4-3-solve.html",
          keywords: "solve gauss seidel sweep 逐行 dissect f h hessian 弹簧 stiffness colPivHouseholderQr dx 顶点更新" },
        { id: "4-4", title: "Chebyshev 加速：omega 与 applyAccelerator", file: "chapters/04-code/4-4-chebyshev.html",
          keywords: "chebyshev acceleration omega rho getAcceleratorOmega applyAccelerator prevprevPos 加速 收敛 spectral radius" },
        { id: "4-5", title: "simulate() 主循环与可视化", file: "chapters/04-code/4-5-main-loop.html",
          keywords: "simulate main loop substep frame iteration updateVelocity saveOutputs json blender 可视化 主循环" },
      ],
    },
    {
      id: "p5",
      label: "Part 5",
      title: "实验与压力测试 · Experiments",
      sections: [
        { id: "5-1", title: "高质量比：XPBD 为何崩、VBD 为何不崩", file: "chapters/05-experiments/5-1-mass-ratio.html",
          keywords: "high mass ratio 高质量比 1000 heavy tip 崩 crush primal dual xpbd vbd 不崩 initializeTilted 实验" },
        { id: "5-2", title: "高刚度比：VBD 的软肋", file: "chapters/05-experiments/5-2-stiffness-ratio.html",
          keywords: "stiffness ratio 刚度比 软肋 limitation 1e4 1e8 收敛慢 initializeStiffRatio 局部方法 local 信息传播" },
        { id: "5-3", title: "skip spring = 弯曲，与迭代数的影响", file: "chapters/05-experiments/5-3-skip-spring-iterations.html",
          keywords: "skip spring 弯曲 bending i i+2 迭代数 numIterations 收敛 收敛速度 substep 实验菜单" },
        { id: "5-4", title: "你能跑的实验菜单", file: "chapters/05-experiments/5-4-experiment-menu.html",
          keywords: "experiment menu 实验菜单 config 配置 注释 uncomment initializeHorizontal initializeTilted converged 玩法" },
      ],
    },
    {
      id: "p6",
      label: "Part 6",
      title: "收尾 · The Bigger Picture",
      sections: [
        { id: "6-1", title: "VBD 在谱系里的位置、局限与 AVBD", file: "chapters/06-closing/6-1-place-and-limits.html",
          keywords: "place limits avbd augmented vertex block descent 局限 stiffness ratio 硬约束 future 总结 谱系 位置" },
      ],
    },
    {
      id: "p7",
      label: "Part 7",
      title: "Newton 的世界 · Foundations (Warp + Newton)",
      sections: [
        { id: "7-1", title: "Newton 是什么：从 Isaac/USD 到 Warp-native 引擎", file: "chapters/07-newton-foundations/7-1-what-is-newton.html",
          keywords: "newton warp isaac usd physx mujoco warp.sim deprecated linux foundation gpu 引擎 robotics 定位 关系 disney deepmind nvidia" },
        { id: "7-2", title: "Warp 编程模型：kernel / array / launch / tid", file: "chapters/07-newton-foundations/7-2-warp-model.html",
          keywords: "warp wp.kernel wp.func wp.array wp.launch wp.tid spmd 线程 gpu vec3 mat33 cuda graph capture jit 编程模型" },
        { id: "7-3", title: "Newton 数据模型：Model / State / Control / Contacts", file: "chapters/07-newton-foundations/7-3-data-model.html",
          keywords: "model state control contacts modelbuilder particle_q particle_qd step 契约 静态 动态 数据模型 finalize" },
        { id: "7-4", title: "一个最小 Newton 程序：builder → color → step", file: "chapters/07-newton-foundations/7-4-minimal-program.html",
          keywords: "minimal program builder color finalize state control contacts step loop collide 最小程序 主循环 example" },
      ],
    },
    {
      id: "p8",
      label: "Part 8",
      title: "从一根 strand 到一块 cloth · TinyVBD → Newton particle VBD",
      sections: [
        { id: "8-1", title: "同一个 min G(x)，搬上 GPU：什么没变、什么变了", file: "chapters/08-strand-to-cloth/8-1-same-min-G.html",
          keywords: "min G(x) gpu strand cloth 没变 变了 主线 桥 tinyvbd 串行 并行 incremental potential 一样" },
        { id: "8-2", title: "SolverVBD 全景：step() 的三段式", file: "chapters/08-strand-to-cloth/8-2-solver-overview.html",
          keywords: "solvervbd step initialize iterate finalize 三段式 全景 substep iteration 结构 particle" },
        { id: "8-3", title: "particle 的惯性初始化（对照 TinyVBD 自适应初始化）", file: "chapters/08-strand-to-cloth/8-3-initialization.html",
          keywords: "forward_step 惯性 初始化 inertia y predicted position 自适应 adaptive 差异 对照 没有 acceleration component" },
        { id: "8-4", title: "per-vertex Newton step 在 Warp 里：f_i 与 H_i 装配", file: "chapters/08-strand-to-cloth/8-4-newton-step-warp.html",
          keywords: "per vertex newton step f_i h_i hessian 3x3 solve_elasticity kernel 装配 assemble mass dt 惯性项 inverse delta x" },
        { id: "8-5", title: "graph coloring 与并行 sweep", file: "chapters/08-strand-to-cloth/8-5-coloring-parallel.html",
          keywords: "graph coloring 顶点着色 primal dual 颜色 parallel sweep gauss seidel jacobi 并行 串行 对照 color groups" },
      ],
    },
    {
      id: "p9",
      label: "Part 9",
      title: "真实的弹性与碰撞 · Real Elasticity & Collisions",
      sections: [
        { id: "9-1", title: "弹性元件谱：membrane / volumetric / bending / spring", file: "chapters/09-elasticity-collision/9-1-elastic-elements.html",
          keywords: "neo hookean membrane volumetric tet bending dihedral spring 弹性 元件 cloth soft 三角 fem 能量 对照 弹簧 hessian" },
        { id: "9-2", title: "SPD 投影与 Rayleigh damping：production 稳定性", file: "chapters/09-elasticity-collision/9-2-spd-damping.html",
          keywords: "spd 投影 projection rayleigh damping kd ke stable neo hookean lambda mu clamp 稳定性 production 阻尼" },
        { id: "9-3", title: "self-collision 与 penetration-free", file: "chapters/09-elasticity-collision/9-3-collision.html",
          keywords: "self collision bvh penetration free truncation dat vertex triangle edge edge 碰撞 穿透 截断 对照 无碰撞" },
      ],
    },
    {
      id: "p10",
      label: "Part 10",
      title: "AVBD 与 rigid · 收尾概览",
      sections: [
        { id: "10-1", title: "VBD 的软肋 → AVBD：augmented Lagrangian 与 penalty ramping", file: "chapters/10-avbd/10-1-avbd-idea.html",
          keywords: "avbd augmented vertex block descent lagrangian penalty ramping k_start beta gamma warm start hard soft 软肋 高刚度比 giles 2025" },
        { id: "10-2", title: "Newton 里的 rigid AVBD 一瞥，与进一步阅读", file: "chapters/10-avbd/10-2-rigid-and-further.html",
          keywords: "rigid avbd joints contacts newton 限制 软约束 进一步阅读 further reading 论文 docs demo 收尾 总结" },
      ],
    },
    {
      id: "pa",
      label: "Appendix",
      title: "附录 · Reference",
      sections: [
        { id: "a-1", title: "术语表 Glossary", file: "chapters/appendix/a-1-glossary.html",
          keywords: "glossary terms 术语表 词汇 vbd pbd xpbd pd incremental potential hessian" },
        { id: "a-2", title: "公式与符号速查", file: "chapters/appendix/a-2-cheatsheet.html",
          keywords: "cheatsheet 公式 符号 速查 G(x) f_i H_i omega 速查表 notation" },
        { id: "a-3", title: "参考文献 References", file: "chapters/appendix/a-3-references.html",
          keywords: "references papers arxiv 参考文献 论文 vbd pd xpbd liu chebyshev" },
        { id: "a-4", title: "Newton / Warp 术语表", file: "chapters/appendix/a-4-newton-glossary.html",
          keywords: "glossary 术语 newton warp kernel launch model state control coloring neo hookean avbd 词汇" },
        { id: "a-5", title: "TinyVBD ↔ Newton ↔ Isaac 对照速查", file: "chapters/appendix/a-5-mapping-cheatsheet.html",
          keywords: "mapping cheatsheet 对照 速查 tinyvbd newton isaac usd quaternion model state coloring 概念 映射" },
        { id: "a-6", title: "Newton / VBD / AVBD 参考文献", file: "chapters/appendix/a-6-newton-references.html",
          keywords: "references 参考文献 vbd avbd newton warp paper arxiv siggraph url 论文" },
      ],
    },
  ],
};

/* 扁平化：供上下页导航与搜索使用 */
window.VBOOK.flat = (function () {
  const out = [];
  window.VBOOK.parts.forEach((p) => {
    p.sections.forEach((s) => out.push(Object.assign({ part: p.title, partLabel: p.label }, s)));
  });
  return out;
})();
