import { PLAYERS } from "../utils/constants";
import { getEliminatedPlayers } from "../utils/winnerUtils";
import type { Game, ESPNScoresResponse, PlayersProjectedMNFPoints } from "../types";

interface TiebreakerProps {
  playersProjectedMNFPoints: PlayersProjectedMNFPoints;
  games?: Game[];
  scores?: ESPNScoresResponse;
}

function Tiebreaker({ playersProjectedMNFPoints, games, scores }: TiebreakerProps) {
  const eliminatedPlayers = getEliminatedPlayers(games, scores);

  // Eliminated players go last; within each group, sort low to high by
  // estimated points, with players who have no projection after those.
  const sortedPlayers = [...PLAYERS].sort((a, b) => {
    const eliminatedA = eliminatedPlayers.includes(a);
    const eliminatedB = eliminatedPlayers.includes(b);
    if (eliminatedA !== eliminatedB) return eliminatedA ? 1 : -1;

    const pointsA = playersProjectedMNFPoints[a];
    const pointsB = playersProjectedMNFPoints[b];
    if (pointsA === undefined && pointsB === undefined) return a.localeCompare(b);
    if (pointsA === undefined) return 1;
    if (pointsB === undefined) return -1;
    if (pointsA !== pointsB) return pointsA - pointsB;
    return a.localeCompare(b);
  });

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
            {sortedPlayers.map((player) => {
              const className = eliminatedPlayers.includes(player)
                ? "Tiebreaker__eliminated"
                : undefined;
              return (
                <tr key={player}>
                  <td className={className}>{player}</td>
                  <td className={className}>
                    {playersProjectedMNFPoints[player]}
                  </td>
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
