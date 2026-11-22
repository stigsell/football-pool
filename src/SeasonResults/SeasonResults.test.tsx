import React from "react";
import { render, screen } from "@testing-library/react";
import SeasonResults from "./SeasonResults";
import seasonResults from "../data/seasonResults.json";
import { PLAYERS } from "../utils/constants";
import type { Player } from "../utils/constants";
import { mockGames, mockScoresResponse } from "../__mocks__/testData";
import { LATE_PICK } from "../utils/constants";
import type { Game, SeasonResultsData } from "../types";

const { weeks } = seasonResults as SeasonResultsData;

// Derived from the season data so these stay true as weeks are added.
const recordedTotal = (player: Player): number =>
  weeks.reduce((sum, week) => sum + (week.correctPicks[player] ?? 0), 0);

const recordedLatePicks = (player: Player): number =>
  weeks.reduce((sum, week) => sum + (week.latePicks?.[player] ?? 0), 0);

// The mock games with Nick's pick on the first one missing the deadline.
const mockGamesWithLatePick: Game[] = mockGames.map((game, index) =>
  index === 0
    ? {
        ...game,
        picks: game.picks.map((pick) =>
          pick.player === "Nick" ? { ...pick, pick: LATE_PICK } : pick
        ),
      }
    : game
);

const seasonLeader = (): [Player, number] =>
  PLAYERS.map((player): [Player, number] => [player, recordedTotal(player)]).sort(
    (a, b) => (a[1] === b[1] ? a[0].localeCompare(b[0]) : b[1] - a[1])
  )[0];

describe("SeasonResults", () => {
  it("renders the Season Results heading", () => {
    render(<SeasonResults />);
    expect(screen.getByText("Season Results")).toBeInTheDocument();
  });

  it("still lists each week's winner", () => {
    render(<SeasonResults />);
    expect(screen.getByText("Week")).toBeInTheDocument();
    expect(screen.getByText("Winner")).toBeInTheDocument();
  });

  it("lists every recorded week's winner from the season data", () => {
    const { container } = render(<SeasonResults />);
    const winnersTable = container.querySelectorAll(".SeasonResults__table")[0];
    const rows = Array.from(winnersTable.querySelectorAll("tbody tr")).map(
      (row) => {
        const cells = row.querySelectorAll("td");
        return [cells[0].textContent, cells[1].textContent];
      }
    );

    const expected = weeks
      .filter((week) => (week.winners ?? []).length > 0)
      .sort((a, b) => a.week - b.week)
      .map((week) => [String(week.week), (week.winners ?? []).join(", ")]);

    expect(rows).toEqual(expected);
    expect(rows.length).toBe(weeks.length);
  });

  it("renders a season totals table with Player and # Correct columns", () => {
    render(<SeasonResults />);
    // The late picks and earnings tables have a Player column too.
    expect(screen.getAllByText("Player")).toHaveLength(3);
    expect(screen.getByText("# Correct")).toBeInTheDocument();
  });

  it("lists every player with their season total", () => {
    const { container } = render(<SeasonResults />);
    const totalsTable = container.querySelectorAll(".SeasonResults__table")[1];
    const rows = Array.from(totalsTable.querySelectorAll("tbody tr"));

    expect(rows.length).toBe(PLAYERS.length);

    const totals = Object.fromEntries(
      rows.map((row) => {
        const cells = row.querySelectorAll("td");
        return [cells[0].textContent, Number(cells[1].textContent)];
      })
    );

    PLAYERS.forEach((player) => {
      const expected = weeks.reduce(
        (sum, week) => sum + (week.correctPicks[player] ?? 0),
        0
      );
      expect(totals[player]).toBe(expected);
    });
  });

  it("sorts the season totals from most correct picks to fewest", () => {
    const { container } = render(<SeasonResults />);
    const totalsTable = container.querySelectorAll(".SeasonResults__table")[1];
    const totals = Array.from(totalsTable.querySelectorAll("tbody tr")).map(
      (row) => Number(row.querySelectorAll("td")[1].textContent)
    );

    expect(totals).toEqual([...totals].sort((a, b) => b - a));
  });

  it("puts the season leader at the top", () => {
    const { container } = render(<SeasonResults />);
    const totalsTable = container.querySelectorAll(".SeasonResults__table")[1];
    const firstRow = totalsTable.querySelectorAll("tbody tr")[0];
    const [player, total] = seasonLeader();

    expect(firstRow.querySelectorAll("td")[0].textContent).toBe(player);
    expect(firstRow.querySelectorAll("td")[1].textContent).toBe(String(total));
  });

  describe("earnings", () => {
    const earningsRows = (container: HTMLElement) =>
      Array.from(
        container.querySelectorAll(".SeasonResults__table")[3].querySelectorAll("tbody tr")
      ).map((row) => {
        const cells = row.querySelectorAll("td");
        return [cells[0].textContent, cells[1].textContent];
      });

    // Derived from the season data so this stays true as weeks are added.
    const recordedNet = (player: Player): number =>
      weeks.reduce((sum, week) => {
        const winners = week.winners ?? [];
        return winners.includes(player) ? sum + 110 / winners.length : sum;
      }, -180);

    const money = (amount: number): string =>
      `${amount < 0 ? "-" : ""}$${Math.abs(amount).toFixed(2)}`;

    it("renders a Net Winnings column and no separate Winnings column", () => {
      render(<SeasonResults />);
      expect(screen.getByText("Net Winnings")).toBeInTheDocument();
      expect(screen.queryByText("Winnings")).not.toBeInTheDocument();
    });

    it("lists every player's net winnings after the $180 buy-in", () => {
      const { container } = render(<SeasonResults />);
      const rows = earningsRows(container);

      expect(rows.length).toBe(PLAYERS.length);
      PLAYERS.forEach((player) => {
        const row = rows.find(([name]) => name === player) as string[];
        expect(row[1]).toBe(money(recordedNet(player)));
      });
    });

    it("puts the biggest winner first", () => {
      const { container } = render(<SeasonResults />);
      const [first] = earningsRows(container);
      const best = Math.max(...PLAYERS.map(recordedNet));

      expect(first[1]).toBe(money(best));
    });
  });

  describe("best and worst week cards", () => {
    const cardFor = (container: HTMLElement, label: string): HTMLElement =>
      Array.from(container.querySelectorAll<HTMLElement>(".SeasonResults__card")).find(
        (card) => card.querySelector(".SeasonResults__cardHeader")?.textContent === label
      ) as HTMLElement;

    const detailsFor = (card: HTMLElement): string[] =>
      Array.from(card.querySelectorAll(".SeasonResults__cardDetail")).map(
        (detail) => detail.textContent as string
      );

    // Every recorded (player, week, score), derived from the season data.
    const scores = weeks.flatMap((week) =>
      PLAYERS.filter((player) => week.correctPicks[player] !== undefined).map(
        (player) => ({
          week: week.week,
          player,
          correct: week.correctPicks[player] as number,
        })
      )
    );

    const expectedDetails = (correct: number): string[] =>
      [...new Set(scores.filter((entry) => entry.correct === correct).map((entry) => entry.week))]
        .sort((a, b) => a - b)
        .map((week) => {
          const players = scores
            .filter((entry) => entry.week === week && entry.correct === correct)
            .map((entry) => entry.player);
          return `Week ${week} \u2022 ${players.join(", ")}`;
        });

    it("renders no table for the best and worst weeks", () => {
      const { container } = render(<SeasonResults />);
      expect(container.querySelectorAll(".SeasonResults__table")).toHaveLength(4);
    });

    it("shows the best week's number, week and player", () => {
      const { container } = render(<SeasonResults />);
      const card = cardFor(container, "Best Week");
      const best = Math.max(...scores.map((entry) => entry.correct));

      expect(card.querySelector(".SeasonResults__cardNumber")?.textContent).toBe(String(best));
      expect(detailsFor(card)).toEqual(expectedDetails(best));
    });

    it("shows the worst week's number, week and player", () => {
      const { container } = render(<SeasonResults />);
      const card = cardFor(container, "Worst Week");
      const worst = Math.min(...scores.map((entry) => entry.correct));

      expect(card.querySelector(".SeasonResults__cardNumber")?.textContent).toBe(String(worst));
      expect(detailsFor(card)).toEqual(expectedDetails(worst));
    });

    it("lists the best week card before the worst week card", () => {
      const { container } = render(<SeasonResults />);
      const headers = Array.from(
        container.querySelectorAll(".SeasonResults__cardHeader")
      ).map((header) => header.textContent);

      expect(headers.slice(0, 2)).toEqual(["Best Week", "Worst Week"]);
    });
  });

  describe("most same picks card", () => {
    const alikeCard = (container: HTMLElement): HTMLElement =>
      Array.from(container.querySelectorAll<HTMLElement>(".SeasonResults__card")).find(
        (card) => card.querySelector(".SeasonResults__cardHeader")?.textContent === "Most Same Picks"
      ) as HTMLElement;

    // Season-long same pick counts per pair, from the recorded data.
    const pairTotals = (): Record<string, number> => {
      const totals: Record<string, number> = {};
      weeks.forEach((week) =>
        Object.entries(week.samePicks ?? {}).forEach(([pair, count]) => {
          totals[pair] = (totals[pair] ?? 0) + count;
        })
      );
      return totals;
    };

    it("shows the pair who picked the same most, with how many times", () => {
      const { container } = render(<SeasonResults />);
      const card = alikeCard(container);
      const totals = pairTotals();
      const most = Math.max(...Object.values(totals));
      const expected = Object.keys(totals)
        .filter((pair) => totals[pair] === most)
        .map((pair) => pair.replace("|", " & "));

      expect(card.querySelector(".SeasonResults__cardNumber")?.textContent).toBe(String(most));
      expect(
        Array.from(card.querySelectorAll(".SeasonResults__cardDetail")).map(
          (detail) => detail.textContent
        )
      ).toEqual(expected);
    });

    it("counts the picks of the week being played", () => {
      const liveWeekNumber = Math.max(...weeks.map((week) => week.week)) + 1;
      const recorded = Number(
        alikeCard(render(<SeasonResults />).container).querySelector(
          ".SeasonResults__cardNumber"
        )?.textContent
      );
      const { container } = render(
        <SeasonResults week={liveWeekNumber} games={mockGames} scores={mockScoresResponse} />
      );
      const live = Number(
        alikeCard(container).querySelector(".SeasonResults__cardNumber")?.textContent
      );

      // The live games can only add to the season's best pair.
      expect(live).toBeGreaterThanOrEqual(recorded);
    });
  });

  describe("late picks", () => {
    const latePicksFor = (container: HTMLElement): Record<string, number> => {
      const table = container.querySelectorAll(".SeasonResults__table")[2];
      return Object.fromEntries(
        Array.from(table.querySelectorAll("tbody tr")).map((row) => {
          const cells = row.querySelectorAll("td");
          return [cells[0].textContent as string, Number(cells[1].textContent)];
        })
      );
    };

    it("renders a late picks table below the season totals", () => {
      render(<SeasonResults />);
      expect(screen.getByText("# Late Picks")).toBeInTheDocument();
    });

    it("lists only players with late picks, with their season count", () => {
      const { container } = render(<SeasonResults />);
      const latePicks = latePicksFor(container);
      const expected = PLAYERS.filter((player) => recordedLatePicks(player) > 0);

      expect(Object.keys(latePicks).sort()).toEqual([...expected].sort());
      expected.forEach((player) => {
        expect(latePicks[player]).toBe(recordedLatePicks(player));
      });
    });

    it("sorts the late picks from most to fewest", () => {
      const { container } = render(<SeasonResults />);
      const table = container.querySelectorAll(".SeasonResults__table")[2];
      const counts = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
        Number(row.querySelectorAll("td")[1].textContent)
      );

      expect(counts).toEqual([...counts].sort((a, b) => b - a));
    });

    it("counts the late picks of the week being played", () => {
      const liveWeekNumber = Math.max(...weeks.map((week) => week.week)) + 1;
      const { container } = render(
        <SeasonResults
          week={liveWeekNumber}
          games={mockGamesWithLatePick}
          scores={mockScoresResponse}
        />
      );

      expect(latePicksFor(container).Nick).toBe(recordedLatePicks("Nick") + 1);
    });
  });

  describe("week in progress", () => {
    const totalsFor = (container: HTMLElement): Record<string, number> => {
      const totalsTable = container.querySelectorAll(".SeasonResults__table")[1];
      return Object.fromEntries(
        Array.from(totalsTable.querySelectorAll("tbody tr")).map((row) => {
          const cells = row.querySelectorAll("td");
          return [cells[0].textContent as string, Number(cells[1].textContent)];
        })
      );
    };

    // A week past everything in the season data, so it counts as live.
    const liveWeekNumber = Math.max(...weeks.map((week) => week.week)) + 1;

    it("adds the live scores of the week being played", () => {
      const recordedOnly = totalsFor(render(<SeasonResults />).container);

      const { container } = render(
        <SeasonResults
          week={liveWeekNumber}
          games={mockGames}
          scores={mockScoresResponse}
        />
      );
      const withLive = totalsFor(container);

      // Nick got all three mock games right, Adam two of them.
      expect(withLive.Nick).toBe(recordedOnly.Nick + 3);
      expect(withLive.Adam).toBe(recordedOnly.Adam + 2);
    });

    it("keeps showing the recorded totals when no live week is supplied", () => {
      const { container } = render(<SeasonResults />);
      const totals = totalsFor(container);

      expect(totals.Nick).toBe(recordedTotal("Nick"));
      expect(totals.Noah).toBe(recordedTotal("Noah"));
    });

    it("does not double count a week that is already recorded", () => {
      // Week 1 is in the json file, so its live scores must be ignored.
      const { container } = render(
        <SeasonResults week={1} games={mockGames} scores={mockScoresResponse} />
      );
      const totals = totalsFor(container);

      expect(totals.Nick).toBe(recordedTotal("Nick"));
    });
  });
});
