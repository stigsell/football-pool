import React from "react";
import { render } from "@testing-library/react";
import SeasonResults from "./SeasonResults";

describe("SeasonResults", () => {
  it("renders nothing while the season's results are unavailable", () => {
    const { container } = render(<SeasonResults />);
    expect(container).toBeEmptyDOMElement();
  });
});
