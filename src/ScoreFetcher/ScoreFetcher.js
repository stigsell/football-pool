import React, { useEffect, useState } from "react";

function ScoreFetcher({ children, weekNumber }) {
  const [scores, setScores] = useState([]);
  useEffect(() => {
    fetch(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2024&seasontype=2&week=" +
        weekNumber
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        console.log("data", data);
        setScores(data);
      });
  }, [weekNumber]);
  if (scores.length === 0) return null;
  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { scores });
        }
        return child;
      })}
    </>
  );
}

export default ScoreFetcher;
