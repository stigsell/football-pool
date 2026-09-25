import React from "react";
import { render, screen } from "@testing-library/react";
import SeasonResults from "./SeasonResults";
import seasonResults from "../data/seasonResults.json";
import { PLAYERS } from "../utils/constants";
import type { Player } from "../utils/constants";
import { mockGames, mockScoresResponse } from "../__mocks__/testData";
import type { SeasonResultsData } from "../types";

const { weeks } = seasonResults as SeasonResultsData;

// Derived from the season data so these stay true as weeks are added.
const recordedTotal = (player: Player): number =>
  weeks.reduce((sum, week) => sum + (week.correctPicks[player] ?? 0), 0);

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
      .map((week) => [String(week.week), (week.winners ?? []).join(" & ")]);

    expect(rows).toEqual(expected);
    expect(rows.length).toBe(weeks.length);
  });

  it("renders a season totals table with Player and # Correct columns", () => {
    render(<SeasonResults />);
    expect(screen.getByText("Player")).toBeInTheDocument();
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
