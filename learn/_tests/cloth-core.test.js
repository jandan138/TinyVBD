require("./dom-stub.js");
require("../assets/js/widgets/cloth-core.js");
const assert = require("assert");

const Cloth = window.VBW.Cloth;
assert.strictEqual(typeof Cloth, "function", "Cloth constructor exists");

// Build a small pinned cloth grid.
const cloth = new Cloth({ cols: 5, rows: 5, spacing: 0.1, stiffness: 1e3, gravity: -10, dt: 1 / 60 });
assert.ok(cloth.n === 25, "25 vertices");
assert.ok(cloth.edges.length > 0, "has edges");
assert.ok(Array.isArray(cloth.colors) && cloth.colors.length > 0, "has color groups");

// Coloring validity: no edge connects two same-color vertices.
const colorOf = new Int32Array(cloth.n).fill(-1);
cloth.colors.forEach((grp, ci) => grp.forEach((v) => (colorOf[v] = ci)));
for (const e of cloth.edges) {
  assert.notStrictEqual(colorOf[e.a], colorOf[e.b], "edge endpoints differ in color");
}

// Energy monotonicity: within a frame, more solve iterations never increases incremental potential G.
cloth.forwardStep();
const g0 = cloth.energy();
for (let i = 0; i < 10; i++) cloth.solveSweep();
const g1 = cloth.energy();
assert.ok(g1 <= g0 + 1e-9, `G should not increase: g0=${g0} g1=${g1}`);

// Rest stability: a flat cloth pinned at top, stepped once, stays finite (no NaN/explosion).
for (let f = 0; f < 30; f++) cloth.step(20);
let finite = true;
for (let i = 0; i < cloth.n; i++) if (!isFinite(cloth.px[i]) || !isFinite(cloth.py[i])) finite = false;
assert.ok(finite, "positions remain finite after 30 frames");

console.log("cloth-core: ALL PASS");
