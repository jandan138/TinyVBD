const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { makeEl } = require("./dom-stub.js");
require("../assets/js/widgets/registry.js");
require("../assets/js/widgets/projection-matrix.js");
require("../assets/js/widgets/triangle-mass.js");
require("../assets/js/widgets/vbd-core.js");

const learnRoot = path.resolve(__dirname, "..");
const almostEqual = (a, b, eps = 1e-10) => Math.abs(a - b) <= eps;
const assertVectorClose = (actual, expected, message) => {
  assert.strictEqual(actual.length, expected.length, `${message}: vector length`);
  actual.forEach((value, i) => {
    assert.ok(almostEqual(value, expected[i]), `${message}[${i}]: ${value} != ${expected[i]}`);
  });
};

// Projection geometry: Pi_parallel + Pi_perp = I and the two components are orthogonal.
const projection = window.VBW.projectVector([3, 4], [2, 1]);
assertVectorClose(projection.direction, [0.6, 0.8], "normalized direction");
assertVectorClose(projection.parallel, [1.2, 1.6], "parallel component");
assertVectorClose(projection.perpendicular, [0.8, -0.6], "perpendicular component");
assertVectorClose(
  projection.parallel.map((value, i) => value + projection.perpendicular[i]),
  [2, 1],
  "orthogonal decomposition"
);
assert.ok(
  almostEqual(
    projection.parallel[0] * projection.perpendicular[0] +
      projection.parallel[1] * projection.perpendicular[1],
    0
  ),
  "projected components are orthogonal"
);
assert.throws(
  () => window.VBW.projectVector([Infinity, 0], [1, 0]),
  /finite 2-vector/i,
  "projection rejects a non-finite direction"
);
assert.throws(
  () => window.VBW.projectVector([1, 0], [1]),
  /finite 2-vector/i,
  "projection rejects a vector with the wrong dimension"
);

for (const matrix of [projection.parallelMatrix, projection.perpendicularMatrix]) {
  assert.ok(almostEqual(matrix[1], matrix[2]), "projector is symmetric");
  const squared = [
    matrix[0] * matrix[0] + matrix[1] * matrix[2],
    matrix[0] * matrix[1] + matrix[1] * matrix[3],
    matrix[2] * matrix[0] + matrix[3] * matrix[2],
    matrix[2] * matrix[1] + matrix[3] * matrix[3],
  ];
  assertVectorClose(squared, matrix, "projector is idempotent");
}

// Spring curvature: analytic directional curvature agrees with a central finite difference.
const spring = { d: [0.6, 0.8], stiffness: 3, restLength: 0.7 };
const springHessian = window.VBW.springHessian2D(
  spring.d,
  spring.stiffness,
  spring.restLength
);
const direction = [-0.8, 0.6];
const hq = [
  springHessian[0] * direction[0] + springHessian[1] * direction[1],
  springHessian[2] * direction[0] + springHessian[3] * direction[1],
];
const analyticCurvature = direction[0] * hq[0] + direction[1] * hq[1];
const epsilon = 1e-4;
const energy = (offset) =>
  window.VBW.springEnergy2D(
    [spring.d[0] + offset * direction[0], spring.d[1] + offset * direction[1]],
    spring.stiffness,
    spring.restLength
  );
const finiteDifference = (energy(epsilon) - 2 * energy(0) + energy(-epsilon)) / (epsilon * epsilon);
assert.ok(
  almostEqual(analyticCurvature, finiteDifference, 1e-6),
  `spring directional curvature: analytic=${analyticCurvature}, finite=${finiteDifference}`
);
assert.throws(
  () => window.VBW.springHessian2D([0, 0], 1, 1),
  /undefined at zero length/i,
  "positive-rest-length spring Hessian is undefined at zero length"
);
assert.ok(
  almostEqual(window.VBW.springEnergy2D([0, 0], 3, 2), 6),
  "spring energy remains defined at zero length"
);
assertVectorClose(
  window.VBW.springHessian2D([0, 0], 3, 0),
  [3, 0, 0, 3],
  "zero-rest-length spring has Hessian kI at the origin"
);
const nearZeroSpringHessian = window.VBW.springHessian2D([1e-15, 0], 2, 1);
assert.ok(
  nearZeroSpringHessian.every(Number.isFinite),
  "a nonzero spring length is not silently treated as exact zero"
);
assert.ok(
  nearZeroSpringHessian[3] < -1e14,
  "near-zero positive-rest-length spring retains its large transverse curvature"
);
const hugeDirectionProjection = window.VBW.projectVector(
  [Number.MAX_VALUE, Number.MAX_VALUE],
  [1, 0]
);
assertVectorClose(
  hugeDirectionProjection.direction,
  [Math.SQRT1_2, Math.SQRT1_2],
  "projection normalizes a large finite direction without overflow"
);
assertVectorClose(
  window.VBW.springHessian2D([3, 4], 10, 6),
  [2.32, 5.76, 5.76, 5.68],
  "compressed 3-4-5 spring worked example"
);
assert.throws(
  () => window.VBW.springEnergy2D([1, 0], 0, 1),
  /stiffness.*positive/i,
  "spring helper states its positive-stiffness domain"
);
assert.throws(
  () => window.VBW.springHessian2D([1, 0], 1, -1),
  /rest length.*nonnegative/i,
  "spring helper rejects a negative rest length"
);

// P1 triangle mass: symmetry, row sums, total mass, rigid translation, and lumping.
const totalMass = 12;
const consistent = window.VBW.triangleConsistentMass(totalMass);
assertVectorClose(consistent, [2, 1, 1, 1, 2, 1, 1, 1, 2], "P1 consistent mass");
assertVectorClose(window.VBW.matrixRowSums(consistent, 3), [4, 4, 4], "P1 row sums");
assertVectorClose(window.VBW.triangleLumpedMass(totalMass), [4, 0, 0, 0, 4, 0, 0, 0, 4], "P1 lumped mass");
assert.ok(almostEqual(consistent.reduce((sum, value) => sum + value, 0), totalMass), "total mass is preserved");
assert.ok(
  almostEqual(window.VBW.quadraticForm(consistent, [2, 2, 2]), totalMass * 4),
  "consistent mass gives exact rigid-translation kinetic form"
);
assertVectorClose(
  window.VBW.triangleP2RowSumMasses(totalMass),
  [0, 0, 0, 4, 4, 4],
  "naive P2 row-sum exposes zero vertex masses"
);
assert.ok(
  almostEqual(window.VBW.quadraticForm(consistent, [1, -1, 0]), 2),
  "consistent mass resolves cancellation inside an alternating velocity field"
);
assert.ok(
  almostEqual(window.VBW.quadraticForm(window.VBW.triangleLumpedMass(totalMass), [1, -1, 0]), 8),
  "row-sum lumping changes the alternating-field kinetic form"
);
assert.throws(
  () => window.VBW.triangleConsistentMass(-1),
  /total mass.*positive/i,
  "triangle mass rejects negative total mass"
);
assert.throws(
  () => window.VBW.matrixRowSums([1, 2, 3], 2),
  /matrix.*2.*2/i,
  "row sums reject a mismatched matrix size"
);
assert.throws(
  () => window.VBW.quadraticForm([1, 0, 0], [1, 2]),
  /matrix.*2.*2/i,
  "quadratic form rejects a mismatched matrix size"
);

// A collapsed positive-rest-length edge is not differentiable. The teaching
// solver must keep the remaining system finite and report that it skipped it.
const collapsed = new window.VBW.Strand({ numVerts: 2, dis: 1, stiffness: 10, gravity: 0 });
collapsed.px[1] = collapsed.px[0];
collapsed.py[1] = collapsed.py[0];
collapsed.yx.set(collapsed.px);
collapsed.yy.set(collapsed.py);
const collapsedAssembly = collapsed.assembleVertex(1, 1 / 60);
assert.deepStrictEqual(collapsedAssembly.degenerateEdges, [0], "collapsed spring edge is reported");
assert.ok(
  [...collapsedAssembly.f, ...collapsedAssembly.H, ...collapsedAssembly.dx].every(Number.isFinite),
  "collapsed spring does not inject an arbitrary huge Hessian"
);
const tinyButNonzero = new window.VBW.Strand({
  numVerts: 2, dis: 1e-13, stiffness: 10, tanAngle: 0, gravity: 0,
});
tinyButNonzero.yx.set(tinyButNonzero.px);
tinyButNonzero.yy.set(tinyButNonzero.py);
const tinyAssembly = tinyButNonzero.assembleVertex(1, 1);
assert.deepStrictEqual(tinyAssembly.degenerateEdges, [], "nonzero spring length remains differentiable");
assert.ok(almostEqual(tinyAssembly.H[0], 11), "near-zero rest spring keeps its axial stiffness");

const mountedWidgets = {};
for (const widgetName of ["projection-matrix", "triangle-mass"]) {
  const root = makeEl("div");
  assert.strictEqual(typeof window.VBWidgets[widgetName], "function", `${widgetName} registers an initializer`);
  window.VBWidgets[widgetName](root);
  assert.ok(root.children.length >= 2, `${widgetName} mounts its controls and visualization`);
  mountedWidgets[widgetName] = root;
}

const projectionRoot = mountedWidgets["projection-matrix"];
const projectionCanvas = projectionRoot.children.find((child) => child.tagName === "canvas");
const projectionPanel = projectionRoot.children.find((child) => child.getAttribute("aria-live") === "polite");
assert.ok(projectionRoot.children.some((child) => child.className === "ctrl-row"), "projection widget has reproducible presets");
assert.ok(projectionPanel, "projection readout announces updates accessibly");
assert.strictEqual(projectionCanvas.width, 620, "projection canvas initializes its desktop backing width");
assert.strictEqual(projectionCanvas.height, 350, "projection canvas initializes its desktop backing height");
assert.ok(projectionPanel.innerHTML.includes("Pi_parallel"), "projection widget draws its initial readout");
projectionCanvas.dispatchEvent({ type: "pointerdown", pointerId: 1, clientX: 4, clientY: 4 });
assert.ok(!projectionCanvas.hasPointerCapture(1), "projection widget ignores pointer presses far from a handle");
projectionCanvas.dispatchEvent({ type: "pointerdown", pointerId: 2, clientX: 290, clientY: 114 });
assert.ok(projectionCanvas.hasPointerCapture(2), "projection handle captures its active pointer");
projectionCanvas.dispatchEvent({ type: "lostpointercapture", pointerId: 2 });
assert.ok(!projectionCanvas.hasPointerCapture(2), "lost pointer capture ends a projection drag");
projectionCanvas.dispatchEvent({ type: "pointerdown", pointerId: 3, clientX: 290, clientY: 114 });
assert.ok(projectionCanvas.hasPointerCapture(3), "a new drag can start after lost pointer capture");
projectionCanvas.dispatchEvent({ type: "pointermove", pointerId: 3, clientX: 320, clientY: 100 });
const projectionPresets = projectionRoot.children.find((child) => child.className === "ctrl-row").children[0];
assert.ok(
  !projectionPresets.children.some((button) => button.classList.contains("on")),
  "manual projection dragging clears stale preset highlighting"
);
projectionCanvas.dispatchEvent({ type: "pointerup", pointerId: 3 });

const massRoot = mountedWidgets["triangle-mass"];
const massControls = massRoot.children.find((child) => child.className === "ctrl-row");
assert.ok(massControls.children.length >= 5, "triangle mass widget includes velocity presets");
assert.ok(
  massRoot.children.some((child) => child.getAttribute("aria-live") === "polite"),
  "triangle mass readout announces updates accessibly"
);
const massCanvas = massRoot.children.find((child) => child.tagName === "canvas");
const massPanel = massRoot.children.find((child) => child.getAttribute("aria-live") === "polite");
assert.strictEqual(massCanvas.width, 620, "triangle mass canvas initializes its desktop backing width");
assert.strictEqual(massCanvas.height, 255, "triangle mass canvas initializes its desktop backing height");
assert.ok(massPanel.innerHTML.includes("M_consistent"), "triangle mass widget draws its initial readout");
const velocityInput = massControls.children[1].children[1];
velocityInput.value = 0.5;
velocityInput.dispatchEvent({ type: "input" });
const massPresets = massControls.children[massControls.children.length - 1];
assert.ok(
  !massPresets.children.some((button) => button.classList.contains("on")),
  "manual velocity edits clear stale mass preset highlighting"
);

// Navigation and chapter coverage.
require("../content.js");
const part14 = window.VBOOK.parts.find((part) => part.id === "p14");
assert.ok(part14, "Part 14 is registered in content.js");
assert.deepStrictEqual(
  part14.sections.map((section) => section.id),
  ["14-1", "14-2", "14-3", "14-4", "14-5", "14-6"],
  "Part 14 follows the reviewed six-chapter structure"
);

const requiredCoverage = {
  "14-1": ["directional-curvature", "rayleigh-quotient", "million-dof", "repeated-eigenvalues"],
  "14-2": ["vector-derivative", "projector-geometry", "spring-hessian-derivation", "full-spring-hessian", "zero-length"],
  "14-3": ["sideways-energy", "equilibrium-first", "buckling-threshold", "newton-model"],
  "14-4": ["shape-functions", "kinetic-to-mass", "triangle-integrals", "vector-dofs"],
  "14-5": ["row-sum", "what-is-preserved", "consistent-vs-lumped", "higher-order-warning"],
  "14-6": ["mass-metric", "three-matrices", "generalized-modes", "unified-map"],
};

const requiredConcepts = {
  "14-1": [
    "Rayleigh quotient",
    String.raw`q^\top Hq`,
    String.raw`\rightarrow`,
    String.raw`\tfrac{\text{刚度}}{\text{质量}}`,
    "百万",
    "eigenspace",
  ],
  "14-2": [String.raw`\Pi_\parallel`, String.raw`\Pi_\perp`, "Jacobian", String.raw`H_{\mathrm{spring}}`],
  "14-3": [String.raw`\nabla\Pi`, "Euler", String.raw`P_{\mathrm{cr}}`, "line search"],
  "14-4": [String.raw`N_1=1-\xi-\eta`, String.raw`\rho tA`, String.raw`\otimes I_2`, "consistent mass"],
  "14-5": ["partition of unity", "row-sum", "P2", "zero vertex masses"],
  "14-6": ["Riemannian", String.raw`K\phi=\omega^2M\phi`, "M-orthogonal", "M^{-1/2}"],
};

const requiredWorkedExamples = {
  "14-1": ["6.12", String.raw`\frac{153}{25}`],
  "14-2": ["2.32", "5.76"],
  "14-3": ["-50", "3.7548"],
  "14-4": ["12\\,\\mathrm{kg}", "24\\,\\mathrm J"],
  "14-5": ["T_C=1", "T_L=4"],
  "14-6": ["11.18", "1.78"],
};

function checkLocalLinks(filePath, html) {
  const hrefPattern = /href="([^"]+)"/g;
  let match;
  while ((match = hrefPattern.exec(html))) {
    const href = match[1];
    if (/^(?:https?:|mailto:|javascript:)/.test(href)) continue;
    const [relativePath, anchor] = href.split("#");
    const targetPath = relativePath
      ? path.resolve(path.dirname(filePath), relativePath)
      : filePath;
    assert.ok(fs.existsSync(targetPath), `${path.relative(learnRoot, filePath)} links to missing ${href}`);
    if (anchor) {
      const targetHtml = fs.readFileSync(targetPath, "utf8");
      assert.ok(
        targetHtml.includes(`id="${anchor}"`),
        `${path.relative(learnRoot, filePath)} links to missing anchor ${href}`
      );
    }
  }
}

for (const section of part14.sections) {
  const filePath = path.join(learnRoot, section.file);
  assert.ok(fs.existsSync(filePath), `${section.id} chapter file exists`);
  const html = fs.readFileSync(filePath, "utf8");
  assert.ok(html.includes(`data-section="${section.id}"`), `${section.id} body metadata matches navigation`);
  assert.ok(html.includes('<p class="lede">'), `${section.id} has a lede`);
  assert.ok(html.includes('id="takeaway"'), `${section.id} has a takeaway`);
  assert.ok(html.includes('id="worked-example"'), `${section.id} has a worked numerical example`);
  assert.ok(html.includes('id="exercise"'), `${section.id} has a short self-check exercise`);
  assert.ok(
    html.includes(`Part 14 · Hessian, Mass &amp; Modes · ${section.id}`),
    `${section.id} eyebrow names the complete Part 14 arc`
  );

  const headingIds = [...html.matchAll(/<h[23] id="([^"]+)"/g)].map((match) => match[1]);
  assert.strictEqual(new Set(headingIds).size, headingIds.length, `${section.id} heading ids are unique`);
  for (const id of requiredCoverage[section.id]) {
    assert.ok(headingIds.includes(id), `${section.id} covers #${id}`);
  }
  for (const concept of requiredConcepts[section.id]) {
    assert.ok(html.includes(concept), `${section.id} includes ${concept}`);
  }
  for (const value of requiredWorkedExamples[section.id]) {
    assert.ok(html.includes(value), `${section.id} worked example includes ${value}`);
  }
  checkLocalLinks(filePath, html);
}

const correctedNavigationTitles = {
  "3-6": "惯性偏置、可逆求解与下降验收",
  "10-2": "PSD clamp、SPD 总块与 Rayleigh damping",
  "13-9": "MPM 篇收束：三条现代路线与算法地图",
};
for (const [sectionId, expectedTitle] of Object.entries(correctedNavigationTitles)) {
  const section = window.VBOOK.flat.find((candidate) => candidate.id === sectionId);
  assert.strictEqual(section.title, expectedTitle, `${sectionId} navigation title matches its revised chapter`);
}

const projectionPage = fs.readFileSync(path.join(learnRoot, part14.sections[1].file), "utf8");
assert.ok(projectionPage.includes('data-widget="projection-matrix"'), "spring derivation embeds projection widget");
assert.ok(
  projectionPage.indexOf("projection-matrix.js") < projectionPage.indexOf("book.js"),
  "projection widget script loads before book.js"
);
const massPage = fs.readFileSync(path.join(learnRoot, part14.sections[4].file), "utf8");
assert.ok(massPage.includes('data-widget="triangle-mass"'), "mass lumping embeds triangle mass widget");
assert.ok(
  massPage.indexOf("triangle-mass.js") < massPage.indexOf("book.js"),
  "triangle mass widget script loads before book.js"
);

// Semantic regressions that would contradict the new derivations.
const forbiddenClaims = [
  "VBD 那套逐顶点下降也就立不住了",
  "三角形可以三条边长都不变，却被压扁",
  "全局单调下降保证无需 line search",
  "压缩屈曲方向",
  "Hessian：力对位置的导数",
  "Gauss-Seidel 单调下降",
  "还是单调下降的 Gauss-Seidel 收敛",
  "primal、保留完整局部 Hessian、$G$ 单调下降",
  "也不做 line search——这听起来很危险，为什么它依然稳",
  "待写的 Part 13",
  "等 Part 13 的 MPM 写就",
];
function listHtmlFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listHtmlFiles(entryPath));
    else if (entry.name.endsWith(".html")) files.push(entryPath);
  }
  return files;
}

const allTutorialText = listHtmlFiles(path.join(learnRoot, "chapters"))
  .map((filePath) => fs.readFileSync(filePath, "utf8"))
  .join("\n");
for (const claim of forbiddenClaims) {
  assert.ok(!allTutorialText.includes(claim), `obsolete claim removed: ${claim}`);
}

const appendixCoverage = {
  "chapters/appendix/a-1-glossary.html": [
    "../14-curvature-mass/14-1-hessian-geometry.html",
    "../14-curvature-mass/14-4-consistent-mass.html",
    "../14-curvature-mass/14-6-mass-metric-modes.html",
    "generalized eigenproblem",
  ],
  "chapters/appendix/a-2-cheatsheet.html": [
    String.raw`q^\top Hq`,
    String.raw`M_{ij}=\int`,
    String.raw`K\phi=\omega^2M\phi`,
    String.raw`\frac{\rho tA}{12}`,
  ],
  "chapters/appendix/a-8-fem-references.html": [
    "consistent mass",
    "mass lumping",
    "modal analysis",
    "../14-curvature-mass/14-4-consistent-mass.html",
  ],
};
for (const [relativePath, concepts] of Object.entries(appendixCoverage)) {
  const html = fs.readFileSync(path.join(learnRoot, relativePath), "utf8");
  for (const concept of concepts) {
    assert.ok(html.includes(concept), `${relativePath} includes ${concept}`);
  }
}

// The navigation file is the book's source of truth: every registered chapter must be loadable.
for (const section of window.VBOOK.flat) {
  const filePath = path.join(learnRoot, section.file);
  assert.ok(fs.existsSync(filePath), `navigation target exists: ${section.file}`);
  const html = fs.readFileSync(filePath, "utf8");
  assert.ok(html.includes(`data-section="${section.id}"`), `${section.id} data-section matches content.js`);
  const headingIds = [...html.matchAll(/<h[23] id="([^"]+)"/g)].map((match) => match[1]);
  assert.strictEqual(new Set(headingIds).size, headingIds.length, `${section.id} has unique heading ids`);
  checkLocalLinks(filePath, html);

  for (const widgetMatch of html.matchAll(/data-widget="([^"]+)"/g)) {
    const scriptName = `${widgetMatch[1]}.js`;
    assert.ok(html.includes(scriptName), `${section.id} loads its ${scriptName} widget`);
    assert.ok(html.indexOf(scriptName) < html.indexOf("book.js"), `${section.id} loads ${scriptName} before book.js`);
  }
}

console.log("second-order-tutorial: ALL PASS");
