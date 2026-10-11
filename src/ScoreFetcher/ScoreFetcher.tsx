import React, { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { ESPN_API_URL } from "../utils/constants";
import { applySimulatedWinners } from "../utils/simulationUtils";
import type { SimulatedWinners } from "../utils/simulationUtils";
import type { ESPNScoresResponse, Game } from "../types";

interface ScoreFetcherProps {
  children: React.ReactNode;
  weekNumber: number;
  games?: Game[];
  simulated?: SimulatedWinners;
}

function ScoreFetcher({ children, weekNumber, games = [], simulated = {} }: ScoreFetcherProps) {
  const [scores, setScores] = useState<ESPNScoresResponse | null>(null);

  useEffect(() => {
    fetch(ESPN_API_URL + weekNumber)
      .then((res) => {
        return res.json();
      })
      .then((data: ESPNScoresResponse) => {
        setScores(data);
      });
  }, [weekNumber]);

  if (scores === null) return null;

  const shownScores = applySimulatedWinners(scores, games, simulated);

  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as ReactElement<{ scores: ESPNScoresResponse }>, { scores: shownScores });
        }
        return child;
      })}
    </>
  );
}

export default ScoreFetcher;
