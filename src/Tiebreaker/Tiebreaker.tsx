import { PLAYERS } from "../utils/constants";
import type { PlayersProjectedMNFPoints } from "../types";

interface TiebreakerProps {
  playersProjectedMNFPoints: PlayersProjectedMNFPoints;
}

function Tiebreaker({ playersProjectedMNFPoints }: TiebreakerProps) {
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
                <tr key={player}>
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
