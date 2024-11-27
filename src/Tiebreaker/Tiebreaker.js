import React from "react";
import { PLAYERS } from "../utils/constants";

function Tiebreaker({ playersProjectedMNFPoints, games, scores }) {
  return (
    <>
      <h2>Tiebreaker</h2>
      <div className="Tiebreaker">
        <table className="Tiebreaker__table">
          <thead>
            <tr>
              <td>
                <b>Player</b>
              </td>
              <td>
                <b>Estimated MNF Points</b>
              </td>
            </tr>
          </thead>
          <tbody>
            {PLAYERS.map((player) => {
              return (
                <tr>
                  <td>{player}</td>
                  <td>{playersProjectedMNFPoints[player]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Tiebreaker;
