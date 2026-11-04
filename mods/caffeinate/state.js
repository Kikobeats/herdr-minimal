export const MODES = Object.freeze({ ON: "on", AGENT: "agent", OFF: "off" });

export function modeOf(value) {
  return Object.values(MODES).includes(value) ? value : MODES.OFF;
}

export function needsAwakeProcess(mode) {
  return mode !== MODES.OFF;
}

export function ownedAwakeTerminal(result) {
  if (result.code !== 0) return null;
  try {
    const terminal = JSON.parse(result.stdout);
    return terminal.state === "live" && terminal.labels?.["herdr.caffeinate"] === "true" ? terminal : null;
  } catch {
    return null;
  }
}
