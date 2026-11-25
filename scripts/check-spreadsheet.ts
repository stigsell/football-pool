#!/usr/bin/env node
/**
 * Validates the current week's picks spreadsheet before the app starts.
 * Flags rows where a team code isn't recognized, or a player's pick doesn't
 * match either team actually playing in that game (the classic typo shape:
 * "BART" for "BALT", "BUFF" for "BUF", etc). A late pick, recorded as the
 * LATE_PICK marker from constants.ts, is allowed on any game.
 *
 * Also checks the blank for the week after, which the Submit Picks page fills
 * in, so a typo in a matchup is caught before anyone picks from it.
 *
 * When run from a terminal, offers to fix each typo that has an obvious answer
 * and updates the spreadsheet on a "y".
 *
 * Usage: npm run check:spreadsheet [-- <path to .xlsx>]
 */
import { interactiveConfirm, runCheck } from "./spreadsheet";

runCheck(process.argv[2], interactiveConfirm()).then(
  (passed) => process.exit(passed ? 0 : 1),
  (err: Error) => {
    console.error(`Spreadsheet check failed: ${err.message}`);
    process.exit(1);
  }
);
