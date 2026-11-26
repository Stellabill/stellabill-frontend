import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FeatureCell from "./FeatureCell";

describe("FeatureCell", () => {
  it("renders an element labelled 'Included' when value is true", () => {
    render(<FeatureCell value={true} />);
    expect(screen.getByLabelText("Included")).toBeInTheDocument();
  });

  it("renders an element labelled 'Not included' when value is false", () => {
    render(<FeatureCell value={false} />);
    expect(screen.getByLabelText("Not included")).toBeInTheDocument();
  });

  it("renders the string as text with no icon when value is a string", () => {
    render(<FeatureCell value="Basic" />);
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.queryByLabelText("Included")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Not included")).not.toBeInTheDocument();
  });
});
