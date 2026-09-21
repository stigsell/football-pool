import React from "react";
import { render, screen } from "@testing-library/react";
import SeasonResults from "./SeasonResults";
import seasonResults from "../data/seasonResults.json";
import { PLAYERS } from "../utils/constants";
import { mockGames, mockScoresResponse } from "../__mocks__/testData";
import type { SeasonResultsData } from "../types";

const { weeks } = seasonResults as SeasonResultsData;

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

    // Noah's 12 in week 1 is the best single week so far.
    expect(firstRow.querySelectorAll("td")[0].textContent).toBe("Noah");
    expect(firstRow.querySelectorAll("td")[1].textContent).toBe("12");
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

    it("adds the live scores of the week being played", () => {
      const recordedOnly = totalsFor(render(<SeasonResults />).container);

      const { container } = render(
        <SeasonResults week={2} games={mockGames} scores={mockScoresResponse} />
      );
      const withLive = totalsFor(container);

      // Nick got all three mock games right, Adam two of them.
      expect(withLive.Nick).toBe(recordedOnly.Nick + 3);
      expect(withLive.Adam).toBe(recordedOnly.Adam + 2);
    });

    it("keeps showing the recorded totals when no live week is supplied", () => {
      const { container } = render(<SeasonResults />);
      const totals = totalsFor(container);

      const week1 = weeks[0].correctPicks;
      expect(totals.Nick).toBe(week1.Nick);
      expect(totals.Noah).toBe(week1.Noah);
    });

    it("does not double count a week that is already recorded", () => {
      // Week 1 is in the json file, so its live scores must be ignored.
      const { container } = render(
        <SeasonResults week={1} games={mockGames} scores={mockScoresResponse} />
      );
      const totals = totalsFor(container);

      expect(totals.Nick).toBe(weeks[0].correctPicks.Nick);
    });
  });
});
