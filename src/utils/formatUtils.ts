import type { ESPNEvent } from "../types";

export const formatInProgressGameClock = (event: ESPNEvent): string => {
  const period = event["status"]["period"];
  return (period > 4 ? "OT" : "Q" + period) + " \u2022 " + event["status"]["displayClock"];
};

export const formatTwoScores = (away_score: number, home_score: number): string =>
  away_score + " - " + home_score;

// Kickoff in the viewer's local time zone, e.g. "Sun 1:00" (no am/pm).
export const formatKickoff = (event: ESPNEvent): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(event.date));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("weekday")} ${part("hour")}:${part("minute")}`;
};
