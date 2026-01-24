import type { ESPNEvent } from "../types";

export const formatInProgressGameClock = (event: ESPNEvent): string =>
  "Q" + event["status"]["period"] + " " + event["status"]["displayClock"];

export const formatTwoScores = (away_score: number, home_score: number): string =>
  away_score + " - " + home_score;
