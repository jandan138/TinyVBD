require("./dom-stub.js");
require("../assets/js/widgets/gripper-core.js");
const assert = require("assert");

const G = window.VBW.GripperCore;
assert.strictEqual(typeof G, "function");

const seq = G.run({ mode: "sequential", mu: 0.85, fMax: 1, mimicOn: true, forceLimitOn: true }, 180);
assert.strictEqual(seq.lifted, false, "sequential should not lift");
assert.strictEqual(seq.hold, false, "sequential should not stably hold");

const cpl = G.run({ mode: "coupled", mu: 0.85, fMax: 1, mimicOn: true, forceLimitOn: true }, 180);
assert.strictEqual(cpl.lifted, true, "coupled should lift");
assert.strictEqual(cpl.hold, true, "coupled should hold");

const zero = G.run({ mode: "coupled", mu: 0, fMax: 1, mimicOn: true, forceLimitOn: true }, 180);
assert.strictEqual(zero.lifted, false, "zero friction must not lift");
assert.strictEqual(zero.hold, false, "zero friction must not hold");

console.log("gripper-core: ALL PASS");
