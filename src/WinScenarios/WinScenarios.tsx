import { getRemainingGames } from "../utils/gameEventUtils";
import { getWinScenarios } from "../utils/scenarioUtils";
import type { Game, ESPNScoresResponse, PlayersProjectedMNFPoints } from "../types";

interface WinScenariosProps {
  games: Game[];
  scores?: ESPNScoresResponse;
  playersProjectedMNFPoints: PlayersProjectedMNFPoints;
}

// Only worth showing near the end of the week, while the result is still open.
const MAX_REMAINING_GAMES = 2;

function WinScenarios({ games, scores, playersProjectedMNFPoints }: WinScenariosProps) {
  if (!scores) return null;

  const remainingGames = getRemainingGames(games, scores).length;
  if (remainingGames === 0 || remainingGames > MAX_REMAINING_GAMES) return null;

  // Hidden once only one player can win, or once the winners have clinched.
  const scenarios = getWinScenarios(games, scores, playersProjectedMNFPoints);
  if (scenarios.length < 2) return null;
  if (scenarios.every((scenario) => scenario.clinched)) return null;

  return (
    <>
      <h2>Win Scenarios</h2>
      <div className="WinScenarios">
        <table className="WinScenarios__table">
          <thead>
            <tr>
              <td>
                <b>Player</b>
              </td>
              <td>
                <b>Needs to win</b>
              </td>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(({ player, needs }) => (
              <tr key={player}>
                <td>{player}</td>
                <td>
                  <ul className="WinScenarios__needs">
                    {needs.map(({ condition, result }) => (
                      <li key={condition + result}>
                        {condition} <b>({result})</b>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default WinScenarios;
