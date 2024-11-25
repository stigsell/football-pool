export const formatInProgressGameClock = (event) =>
  "Q" + event["status"]["period"] + " " + event["status"]["displayClock"];
export const formatTwoScores = (away_score, home_score) =>
  away_score + " - " + home_score;
