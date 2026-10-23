import { render, screen } from "@testing-library/react";
import StatsBar from "@/components/StatsBar";

describe("StatsBar", () => {
  it("shows dashes while stats are loading", () => {
    render(<StatsBar stats={null} />);
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getAllByText("-").length).toBe(4);
  });

  it("shows the numbers from the stats", () => {
    render(
      <StatsBar
        stats={{
          total: 3,
          byStatus: { APPLIED: 2, INTERVIEW: 1 },
          responseRate: 33,
          perWeek: {},
        }}
      />
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByText("Offers").nextSibling).toHaveTextContent("0");
  });
});