import React, { useEffect, useState } from "react";
import { ESPN_API_URL } from "../utils/constants";

function ScoreFetcher({ children, weekNumber }) {
  const [scores, setScores] = useState([]);
  useEffect(() => {
    fetch(ESPN_API_URL + weekNumber)
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
