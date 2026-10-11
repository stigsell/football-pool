# How the win probabilities are calculated

The **Win %** column on the Leaderboard is the chance each player wins the week's pool, estimated by Monte Carlo simulation (`src/utils/simulationUtils.ts`). The column is hidden once the winners are clinched or no games remain, and eliminated players are left blank.

## 1. Start from the current state

The players' current number of correct picks, and the list of games that have not finished.

## 2. Pick a win probability for each remaining game

For each unfinished game, the probability that the **home** team wins is taken from the first source available in the ESPN scoreboard response:

1. **Live win probability** (game in progress): `situation.lastPlay.probability`, ESPN's own in-game model. `home / (home + away)` is used, which drops the tiny tie share.
2. **Moneyline** (game not started): `odds[0].moneyline` (closing line). Each American line is converted to an implied probability (`-175 → 175/275`, `+145 → 100/245`), then the two sides are normalized so they sum to 1, which removes the sportsbook's margin. Example: `-175 / +145` gives about 61% for the home team.
3. **50/50** if neither is present.

## 3. Simulate the rest of the week

The simulation runs 10,000 times. Each run:

1. Draws a winner for every remaining game using the probabilities above.
2. Adds each player's newly correct picks to their current total. A late pick (`X`) never counts.
3. Takes the player(s) with the highest total.
4. If several are tied, the MNF points tiebreaker decides (closest projected total wins; see below). Players still tied after that split the win.

A player's **Win %** is their share of the 10,000 runs, where a split win counts as an equal fraction for each winner (so the percentages add up to 100%). Values under 1% display as `<1%`.

## 4. The MNF total (tiebreaker)

- If the MNF game is finished, its actual total is used.
- Otherwise the final total is drawn from a normal distribution with a standard deviation of 10 points. Its mean is the game's **over/under** from the odds when available, otherwise 45. The draw is never lower than the points already scored.

## Limitations

- The numbers are re-drawn when the scores change, so they move slightly between refreshes.
- Games are treated as independent, and ties (NFL draws) are ignored.
- For an in-progress MNF game, the total is still drawn from the normal distribution rather than from how much of the game is left.
- Moneylines are the sportsbook's, not a model of ours; they can be missing for games far from kickoff, in which case those games fall back to 50/50.
