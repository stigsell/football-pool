import React from "react";

function Tiebreaker({ playersProjectedMNFPoints }) {
  console.log("playersProjectedMNFPoints", playersProjectedMNFPoints);
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
            <tr>
              <td>{"Adam"}</td>
              <td>{playersProjectedMNFPoints["Adam"]}</td>
            </tr>
            <tr>
              <td>{"Alex"}</td>
              <td>{playersProjectedMNFPoints["Alex"]}</td>
            </tr>
            <tr>
              <td>{"Ben"}</td>
              <td>{playersProjectedMNFPoints["Ben"]}</td>
            </tr>
            <tr>
              <td>{"Connor"}</td>
              <td>{playersProjectedMNFPoints["Connor"]}</td>
            </tr>
            <tr>
              <td>{"Kylee"}</td>
              <td>{playersProjectedMNFPoints["Kylee"]}</td>
            </tr>
            <tr>
              <td>{"Nick"}</td>
              <td>{playersProjectedMNFPoints["Nick"]}</td>
            </tr>
            <tr>
              <td>{"Noah"}</td>
              <td>{playersProjectedMNFPoints["Noah"]}</td>
            </tr>
            <tr>
              <td>{"Rick"}</td>
              <td>{playersProjectedMNFPoints["Rick"]}</td>
            </tr>
            <tr>
              <td>{"Ricky"}</td>
              <td>{playersProjectedMNFPoints["Ricky"]}</td>
            </tr>
            <tr>
              <td>{"Tammy"}</td>
              <td>{playersProjectedMNFPoints["Tammy"]}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Tiebreaker;
