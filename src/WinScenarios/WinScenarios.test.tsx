import React from "react";
import { render, screen } from "@testing-library/react";
import WinScenarios from "./WinScenarios";
import {
  mockWeek4Games,
  mockWeek4ProjectedMNFPoints,
  createWeek4Scores,
} from "../__mocks__/testData";
import type { ESPNScoresResponse } from "../types";

const renderWith = (scores?: ESPNScoresResponse) =>
  render(
    <WinScenarios
      games={mockWeek4Games}
      scores={scores}
      playersProjectedMNFPoints={mockWeek4ProjectedMNFPoints}
    />
  );

describe("WinScenarios", () => {
  it("shows each contender and what they need with one game left", () => {
    const { container } = renderWith(createWeek4Scores());
    expect(screen.getByText("Win Scenarios")).toBeInTheDocument();
    expect(screen.getByText("Needs to win")).toBeInTheDocument();
    expect(
      screen.getByText("ATL wins and total points are 41–43", { exact: false })
    ).toBeInTheDocument();
    const names = Array.from(container.querySelectorAll("tbody tr")).map(
      (row) => row.querySelectorAll("td")[0].textContent
    );
    expect(names).toEqual(["Nick", "Ben", "Jake", "Noah", "Rick"]);
  });

  it("bolds what each condition gets the player", () => {
    renderWith(createWeek4Scores());
    const bolded = screen.getByText("(win outright)");
    expect(bolded.tagName).toBe("B");
    expect(bolded.closest("li")?.textContent).toBe(
      "ATL wins and total points are 41–43 (win outright)"
    );
  });

  it("lists every player's conditions as bullets", () => {
    renderWith(createWeek4Scores());
    const benRow = screen.getByText("Ben").closest("tr") as HTMLElement;
    expect(
      Array.from(benRow.querySelectorAll("li")).map((li) => li.textContent)
    ).toEqual([
      "ATL wins and total points are ≤ 40 (split with Rick)",
      "NO wins and total points are ≤ 41 (split with Rick)",
      "NO wins and total points are exactly 42 (split with Rick, Noah, and Jake)",
    ]);
    // Nick has a single condition, still shown as a one-bullet list.
    const nickRow = screen.getByText("Nick").closest("tr") as HTMLElement;
    expect(
      Array.from(nickRow.querySelectorAll("li")).map((li) => li.textContent)
    ).toEqual(["ATL wins and total points are 41–43 (win outright)"]);
  });

  it("shows with two games left", () => {
    renderWith(
      createWeek4Scores({
        "DET @ CAR": { description: "Scheduled" },
        "ATL @ NO": { description: "Scheduled" },
      })
    );
    expect(screen.getByText("Win Scenarios")).toBeInTheDocument();
  });

  it("is hidden with three or more games left", () => {
    const { container } = renderWith(
      createWeek4Scores({
        "KC @ LV": { description: "Scheduled" },
        "DET @ CAR": { description: "Scheduled" },
        "ATL @ NO": { description: "Scheduled" },
      })
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("is hidden once every game is final", () => {
    const { container } = renderWith(
      createWeek4Scores({ "ATL @ NO": { description: "Final", away: 21, home: 20 } })
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("is hidden, heading included, when only one player can still win", () => {
    // MNF ended 21-20 (41 points) with DET @ CAR left: Nick wins either way.
    const { container } = renderWith(
      createWeek4Scores({
        "DET @ CAR": { description: "Scheduled" },
        "ATL @ NO": { description: "Final", away: 21, home: 20 },
      })
    );
    expect(screen.queryByText("Win Scenarios")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("is hidden once the winners have clinched, even before MNF ends", () => {
    // MNF at 44 points: Noah and Jake split whatever happens now.
    const { container } = renderWith(
      createWeek4Scores({ "ATL @ NO": { description: "In Progress", away: 20, home: 24 } })
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing before scores load", () => {
    const { container } = renderWith(undefined);
    expect(container).toBeEmptyDOMElement();
  });
});
