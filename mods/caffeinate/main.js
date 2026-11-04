import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { appHome, closeOverlay, hc, props, setShared, shared, theme } from "herdr";
import { MODES, modeOf, needsAwakeProcess, ownedAwakeTerminal } from "./state.js";

const MODE_KEY = "caffeinate.mode";
const LEGACY_MODE_KEY = "keep-awake.mode";
const PROCESS_NAME = "herdr-caffeinate";
const PROCESS_LABEL = "herdr.caffeinate=true";
const PROCESS_MODE_LABEL = "herdr.caffeinate.mode";
const REFRESH_INTERVAL_MS = 2000;
const OPTIONS = [
  { mode: MODES.ON, title: "On", detail: "Keep this computer awake continuously" },
  { mode: MODES.AGENT, title: "Agent", detail: "Stay awake while an agent is working" },
  { mode: MODES.OFF, title: "Off", detail: "Allow normal system sleep behavior" },
];

function commandResultError(result) {
  return result.stderr?.trim() || result.stdout?.trim() || `Herdr Core exited with code ${result.code}.`;
}

export default class KeepAwake extends View {
  init(_props, cx) {
    this.busy = false;
    this.error = "";
    if (shared(MODE_KEY) === undefined) setShared(MODE_KEY, modeOf(shared(LEGACY_MODE_KEY)));
    this.reconcile(cx);
    cx.timer.every(REFRESH_INTERVAL_MS, (cx) => this.reconcile(cx));
  }

  selectedMode() {
    return modeOf(shared(MODE_KEY));
  }

  select(mode, cx) {
    setShared(MODE_KEY, mode);
    this.error = "";
    this.reconcile(cx);
    closeOverlay(props().overlay);
  }

  reconcile(cx) {
    if (this.busy) return;
    const mode = this.selectedMode();
    this.busy = true;
    cx.spawn(async (cx) => {
      try {
        const existing = ownedAwakeTerminal(await hc(["get", "--json", PROCESS_NAME]));
        const expected = needsAwakeProcess(mode) && existing?.labels?.[PROCESS_MODE_LABEL] === mode;
        if (!expected && existing) {
          const result = await hc(["kill", existing.address]);
          if (result.code !== 0) throw new Error(commandResultError(result));
        }
        if (needsAwakeProcess(mode) && !expected) {
          const result = await hc([
            "run",
            "--bg",
            "--no-parent",
            "--outlive-parent",
            "--no-notify",
            "--name",
            PROCESS_NAME,
            "--label",
            PROCESS_LABEL,
            "--label",
            `${PROCESS_MODE_LABEL}=${mode}`,
            "--",
            "sh",
            `${appHome()}/mods/caffeinate/caffeinate.sh`,
            mode,
          ]);
          if (result.code !== 0) throw new Error(commandResultError(result));
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error);
      } finally {
        this.busy = false;
        cx.notify();
      }
    });
  }

  option(option, selected, t, cx) {
    const active = selected === option.mode;
    return h_flex()
      .id(`caffeinate-${option.mode}`)
      .w_full()
      .min_h(82)
      .px(16)
      .py(12)
      .gap(16)
      .items_center()
      .rounded(10)
      .cursor_pointer()
      .bg(active ? t.raised : t.popover)
      .hover((element) => element.bg(t.hover))
      .on_click((_event, cx) => this.select(option.mode, cx))
      .child(div().size(18).flex_none().rounded(9).border(2).border_color(active ? t.foreground : t.dim).when(active, (element) => element.child(div().m(3).size(8).rounded(4).bg(t.foreground))))
      .child(v_flex().gap(4).child(div().text_size(16).font_medium().text_color(t.foreground).child(option.title)).child(div().text_size(13).text_color(t.muted).child(option.detail)));
  }

  render(cx) {
    const t = theme();
    const selected = this.selectedMode();
    return v_flex()
      .id("caffeinate")
      .size_full()
      .p(24)
      .gap(12)
      .bg(t.popover)
      .child(h_flex().pb(14).border_b(1).border_color(t.border).items_center().child(div().flex_1().text_size(17).font_semibold().text_color(t.foreground).child("Caffeinate")).child(div().text_size(13).text_color(t.muted).child(this.busy ? "Updating…" : `Agent · ${selected === MODES.AGENT ? "Active" : "Inactive"}`)))
      .children(OPTIONS.map((option) => this.option(option, selected, t, cx)))
      .when(Boolean(this.error), (element) => element.child(div().pt(4).text_size(12).text_color(t.blocked).child(this.error)));
  }
}
