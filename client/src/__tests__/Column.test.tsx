import { fireEvent, render, screen } from "@testing-library/react";
import Column from "@/components/Column";

describe("Column", () => {
  it("shows the status name and the count", () => {
    render(
      <Column status="INTERVIEW" count={2} onDropCard={jest.fn()}>
        <p>child</p>
      </Column>
    );
    expect(screen.getByText("Interview")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onDropCard with the card id and the column status", () => {
    const onDropCard = jest.fn();
    render(
      <Column status="OFFER" count={0} onDropCard={onDropCard}>
        <p>child</p>
      </Column>
    );

    const dropZone = screen.getByText("child").parentElement as HTMLElement;
    fireEvent.drop(dropZone, { dataTransfer: { getData: () => "abc-123" } });

    expect(onDropCard).toHaveBeenCalledWith("abc-123", "OFFER");
  });
});