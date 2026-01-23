import React from "react";
import { render, screen } from "@testing-library/react";
import Tiebreaker from "./Tiebreaker";
import { PlayersProjectedMNFPoints } from "../types";

describe("Tiebreaker", () => {
  const mockProjectedMNFPoints: PlayersProjectedMNFPoints = {
    Adam: 45,
    Alex: 50,
    Ben: 42,
    Kylee: 48,
    Nick: 51,
    Rick: 44,
    Ricky: 46,
    Tammy: 40,
    Connor: 55,
    Noah: 38,
    Jake: 47,
  };

  it("renders the Tiebreaker heading", () => {
    render(<Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />);
    expect(screen.getByText("Tiebreaker")).toBeInTheDocument();
  });

  it("renders a table with Player and Estimated MNF Points columns", () => {
    render(<Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />);
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("Estimated MNF Points")).toBeInTheDocument();
  });

  it("displays all 11 players", () => {
    render(<Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />);
    expect(screen.getByText("Adam")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Ben")).toBeInTheDocument();
    expect(screen.getByText("Kylee")).toBeInTheDocument();
    expect(screen.getByText("Nick")).toBeInTheDocument();
    expect(screen.getByText("Rick")).toBeInTheDocument();
    expect(screen.getByText("Ricky")).toBeInTheDocument();
    expect(screen.getByText("Tammy")).toBeInTheDocument();
    expect(screen.getByText("Connor")).toBeInTheDocument();
    expect(screen.getByText("Noah")).toBeInTheDocument();
    expect(screen.getByText("Jake")).toBeInTheDocument();
  });

  it("displays projected points for each player", () => {
    render(<Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />);
    expect(screen.getByText("45")).toBeInTheDocument(); // Adam
    expect(screen.getByText("51")).toBeInTheDocument(); // Nick
    expect(screen.getByText("55")).toBeInTheDocument(); // Connor
  });

  it("renders correct number of rows (header + 11 players)", () => {
    render(<Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />);
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(12); // 1 header + 11 players
  });

  it("has proper table structure with thead and tbody", () => {
    const { container } = render(
      <Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />
    );
    expect(container.querySelector("thead")).toBeInTheDocument();
    expect(container.querySelector("tbody")).toBeInTheDocument();
  });

  it("applies Tiebreaker class to container", () => {
    const { container } = render(
      <Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />
    );
    expect(container.querySelector(".Tiebreaker")).toBeInTheDocument();
  });

  it("applies Tiebreaker__table class to table", () => {
    const { container } = render(
      <Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />
    );
    expect(container.querySelector(".Tiebreaker__table")).toBeInTheDocument();
  });

  it("handles undefined projected points gracefully", () => {
    const partialPoints: PlayersProjectedMNFPoints = {
      Adam: 45,
      Nick: 51,
    };
    render(<Tiebreaker playersProjectedMNFPoints={partialPoints} />);
    // Players without projected points should still render
    expect(screen.getByText("Adam")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  it("handles empty projected points object", () => {
    render(<Tiebreaker playersProjectedMNFPoints={{}} />);
    // Should still render all players
    expect(screen.getByText("Adam")).toBeInTheDocument();
    expect(screen.getByText("Nick")).toBeInTheDocument();
  });
});
