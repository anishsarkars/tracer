/** Literal colors for SVG attributes (recharts). Night theme aligned with landing. */
export const C = {
  ink: "#F4F0FF",
  ink2: "rgba(232, 226, 255, 0.78)",
  ink3: "rgba(232, 226, 255, 0.55)",
  line: "rgba(244, 240, 255, 0.12)",
  line2: "rgba(244, 240, 255, 0.22)",
  lime: "#AAF0FF",
  limeDark: "#5A8FA8",
  up: "#5ED48A",
  down: "#FF7B7F",
  white: "#F4F0FF",
} as const;

export const axisProps = {
  tick: { fill: C.ink3, fontSize: 11 },
  axisLine: false,
  tickLine: false,
} as const;

export const cursorProps = { stroke: C.ink3, strokeDasharray: "3 3" } as const;

export const fmtTimeTick = (t: number, spanSeconds: number): string => {
  const d = new Date(t * 1000);
  if (spanSeconds <= 2 * 86400) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/** Show square markers only when the series is sparse enough to read them. */
export const MARKER_MAX_POINTS = 40;
