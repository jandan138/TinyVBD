require("./dom-stub.js");
require("../assets/js/widgets/graph-coloring.js");
const assert = require("assert");

const gc = window.VBW.greedyColor;
assert.strictEqual(typeof gc, "function", "greedyColor helper exists");

// triangle: 3 nodes, 3 edges (a complete graph K3) -> needs 3 colors
const adj3 = [[1, 2], [0, 2], [0, 1]];
const res3 = gc(adj3);
assert.strictEqual(Math.max(...res3) + 1, 3, "K3 needs 3 colors");

// a path of 4 nodes -> 2 colors
const adjPath = [[1], [0, 2], [1, 3], [2]];
assert.strictEqual(Math.max(...gc(adjPath)) + 1, 2, "path needs 2 colors");

// validity: no edge shares a color, on a small grid built by the widget helper
const { vertAdj, edgeAdj } = window.VBW.buildMeshGraphs(5, 5);
const vc = gc(vertAdj), ec = gc(edgeAdj);
for (let v = 0; v < vertAdj.length; v++)
  for (const o of vertAdj[v]) assert.notStrictEqual(vc[v], vc[o], "vertex coloring valid");
// On a triangle mesh the dual (edge) graph generally needs >= as many colors as the primal.
assert.ok(Math.max(...ec) + 1 >= Math.max(...vc) + 1, "dual colors >= primal colors");

console.log("graph-coloring: ALL PASS");
