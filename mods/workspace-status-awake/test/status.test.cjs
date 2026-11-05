const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function element() {
  const state = { children: [], props: {} };
  const node = new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => {
        target.props[key] = args;
        if (key === "child") target.children.push(args[0]);
        if (key === "when" && args[0]) args[1](node);
        return node;
      };
    },
  });
  return node;
}

function loadStatus(mode) {
  const source = fs.readFileSync(path.join(__dirname, "..", "main.js"), "utf8")
    .replace(/^import .*;\r?\n/gm, "")
    .replace("export default class", "globalThis.WorkspaceStatus = class");
  const colors = { chrome: "chrome", border: "border", muted: "muted", dim: "dim", working: "working", hover: "hover", foreground: "foreground", blocked: "blocked" };
  const context = vm.createContext({
    View: class {},
    div: element,
    h_flex: element,
    svg: (path) => {
      const icon = element();
      icon.path = path;
      return icon;
    },
    theme: () => colors,
    spaces: () => [],
    agents: () => [],
    shared: () => mode,
    window: () => ({}),
    keys: () => [],
    run() {},
  });
  vm.runInContext(source, context, { filename: "workspace-status-awake.js" });
  return { colors, view: new context.WorkspaceStatus() };
}

function findById(node, id) {
  if (node?.props?.id?.[0] === id) return node;
  for (const child of node?.children ?? []) {
    const found = findById(child, id);
    if (found) return found;
  }
  return null;
}

for (const [mode, expectedColor] of [["off", "dim"], ["on", "working"], ["agent", "working"]]) {
  const { colors, view } = loadStatus(mode);
  const caffeinate = findById(view.render(), "caffeinate");
  assert.ok(caffeinate, `Caffeinate control should render for ${mode}`);
  assert.equal(caffeinate.props.text_color[0], colors[expectedColor]);
  assert.equal(caffeinate.children[0].path, "mods/workspace-chrome/pin.svg");
}

console.log("ok: Caffeinate uses one monochrome pin icon with dim Off and working On or Agent colors.");
