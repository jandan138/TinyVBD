// Minimal DOM + browser globals so widget IIFEs run under node for headless physics tests.
// Not a full DOM — just enough surface that registry.js / *-core.js / widget init don't crash.
function makeEl(tag) {
  const children = [];
  const el = {
    tagName: tag, children, style: {}, className: "", attributes: {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    appendChild(c) { children.push(c); return c; },
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    addEventListener() {}, removeEventListener() {},
    setPointerCapture() {}, releasePointerCapture() {},
    querySelector() { return makeEl("div"); },
    querySelectorAll() { return []; },
    getContext() { return makeCtx(); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 600, height: 360 }; },
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html || ""; },
    set textContent(v) { this._text = v; }, get textContent() { return this._text || ""; },
  };
  return el;
}
function makeCtx() {
  const noop = () => {};
  return new Proxy({ canvas: { width: 600, height: 360 } }, {
    get(t, p) { return p in t ? t[p] : noop; },
  });
}
global.window = global.window || {};
global.window.matchMedia = () => ({ matches: false });
global.window.devicePixelRatio = 1;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
  createElement: makeEl,
  createElementNS: (_ns, tag) => makeEl(tag),
  documentElement: { style: { getPropertyValue: () => "#888" } },
};
global.getComputedStyle = () => ({ getPropertyValue: () => "#888" });
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};

// In a browser, window properties (VBW, VBWidgets) are also bare globals.
// Mirror that so widget IIFEs referencing `VBW` / `VBWidgets` resolve under node.
["VBW", "VBWidgets"].forEach((name) => {
  Object.defineProperty(global, name, {
    configurable: true,
    get() { return global.window[name]; },
    set(v) { global.window[name] = v; },
  });
});
module.exports = { makeEl };
