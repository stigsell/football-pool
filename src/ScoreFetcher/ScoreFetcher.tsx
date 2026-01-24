import React, { useEffect, useState, ReactElement } from "react";
import { ESPN_API_URL } from "../utils/constants";
import { ESPNScoresResponse } from "../types";

interface ScoreFetcherProps {
  children: React.ReactNode;
  weekNumber: number;
}

function ScoreFetcher({ children, weekNumber }: ScoreFetcherProps) {
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

  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as ReactElement<{ scores: ESPNScoresResponse }>, { scores });
        }
        return child;
      })}
    </>
  );
}

export default ScoreFetcher;
