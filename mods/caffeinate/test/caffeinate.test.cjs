const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadMod(env) {
  const state = fs.readFileSync(path.join(__dirname, "..", "state.js"), "utf8").replace(/export (const|function) /g, "$1 ");
  const main = fs.readFileSync(path.join(__dirname, "..", "main.js"), "utf8").replace(/^import .*;\r?\n/gm, "").replace("export default class", "globalThis.KeepAwake = class");
  const context = vm.createContext(env);
  vm.runInContext(`${state}\n${main}`, context, { filename: "caffeinate.js" });
  return context.KeepAwake;
}

async function main() {
  let mode = "on";
  let terminal = null;
  const closed = [];
  const calls = [];
  const tasks = [];
  const cx = {
    notify() {},
    spawn(task) { const pending = task(cx); tasks.push(pending); },
    timer: { every() {} },
  };
  const env = {
    View: class {},
    div: () => ({}),
    v_flex: () => ({}),
    h_flex: () => ({}),
    appHome: () => "/Users/test/.config/herdr-app",
    closeOverlay(overlay) { closed.push(overlay); },
    hc: async (args) => {
      calls.push(args);
      if (args[0] === "get") return terminal ? { code: 0, stdout: JSON.stringify(terminal), stderr: "" } : { code: 3, stdout: "", stderr: "not found" };
      return { code: 0, stdout: "", stderr: "" };
    },
    props: () => ({ overlay: "caffeinate" }),
    setShared(_key, value) { mode = value; },
    shared: () => mode,
    theme: () => ({}),
  };

  const KeepAwake = loadMod(env);
  const mod = new KeepAwake();
  mod.init(undefined, cx);
  await Promise.all(tasks);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [["get", "--json", "herdr-caffeinate"], ["run", "--bg", "--no-parent", "--outlive-parent", "--no-notify", "--name", "herdr-caffeinate", "--label", "herdr.caffeinate=true", "--label", "herdr.caffeinate.mode=on", "--", "sh", "/Users/test/.config/herdr-app/mods/caffeinate/caffeinate.sh", "on"]]);

  calls.length = 0;
  terminal = { address: "t1", state: "live", labels: { "herdr.caffeinate": "true", "herdr.caffeinate.mode": "on" } };
  mod.reconcile(cx);
  await Promise.all(tasks);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [["get", "--json", "herdr-caffeinate"]]);

  calls.length = 0;
  mod.select("off", cx);
  await Promise.all(tasks);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [["get", "--json", "herdr-caffeinate"], ["kill", "t1"]]);
  assert.deepEqual(closed, ["caffeinate"]);
  console.log("ok: the mod starts one labelled Core-owned worker, stops only its own worker, and closes after selection.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
