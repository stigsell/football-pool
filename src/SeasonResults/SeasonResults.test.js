import React from "react";
import { render, screen } from "@testing-library/react";
import SeasonResults from "./SeasonResults";

describe("SeasonResults", () => {
  it("renders the Season Results heading", () => {
    render(<SeasonResults />);
    expect(screen.getByText("Season Results")).toBeInTheDocument();
  });

  it("renders a table with Week and Winner columns", () => {
    render(<SeasonResults />);
    expect(screen.getByText("Week")).toBeInTheDocument();
    expect(screen.getByText("Winner")).toBeInTheDocument();
  });

  it("displays week 1 winner Nick", () => {
    render(<SeasonResults />);
    const rows = screen.getAllByRole("row");
    // First row is header, second row is week 1
    expect(rows[1]).toHaveTextContent("1");
    expect(rows[1]).toHaveTextContent("Nick");
  });

  it("displays week 2 winner Kylee", () => {
    render(<SeasonResults />);
    const rows = screen.getAllByRole("row");
    expect(rows[2]).toHaveTextContent("2");
    expect(rows[2]).toHaveTextContent("Kylee");
  });

  it("displays tied winners for week 11", () => {
    render(<SeasonResults />);
    expect(screen.getByText("Adam, Ricky")).toBeInTheDocument();
  });

  it("renders all 17 weeks of results", () => {
    render(<SeasonResults />);
    // Header row + 17 data rows = 18 total rows
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(18);
  });

  it("displays the correct winner for each week", () => {
    render(<SeasonResults />);

    // Check that specific week numbers are present
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();

    // Check that winner names appear (some appear multiple times, so use getAllByText)
    expect(screen.getAllByText("Jake").length).toBe(3); // weeks 5, 6, 13
    expect(screen.getAllByText("Kylee").length).toBe(3); // weeks 2, 7, 14
    expect(screen.getByText("Nick")).toBeInTheDocument(); // week 1
    // Use exact match for "Rick" to avoid matching "Ricky"
    expect(screen.getByText("Rick", { exact: true })).toBeInTheDocument(); // week 17
    // Check that "Adam, Ricky" tie entry exists
    expect(screen.getByText("Adam, Ricky")).toBeInTheDocument();
  });

  it("has proper table structure with thead and tbody", () => {
    const { container } = render(<SeasonResults />);
    expect(container.querySelector("thead")).toBeInTheDocument();
    expect(container.querySelector("tbody")).toBeInTheDocument();
  });

  it("applies SeasonResults class to container", () => {
    const { container } = render(<SeasonResults />);
    expect(container.querySelector(".SeasonResults")).toBeInTheDocument();
  });

  it("applies SeasonResults__table class to table", () => {
    const { container } = render(<SeasonResults />);
    expect(container.querySelector(".SeasonResults__table")).toBeInTheDocument();
  });
});
