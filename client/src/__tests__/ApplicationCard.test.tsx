import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApplicationCard from "@/components/ApplicationCard";
import { Application } from "@/lib/types";

const application: Application = {
  id: "1",
  company: "Google",
  role: "Frontend Developer",
  jobUrl: "https://example.com/job",
  status: "APPLIED",
  salary: "12 LPA",
  notes: "Referral from a friend",
  appliedOn: "2026-10-01T00:00:00.000Z",
  followUpOn: null,
};

function setup() {
  const onMove = jest.fn();
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  render(
    <ApplicationCard
      application={application}
      onMove={onMove}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
  return { onMove, onEdit, onDelete };
}

describe("ApplicationCard", () => {
  it("shows the company, role, salary and job link", () => {
    setup();
    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText("12 LPA")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View job posting" })).toHaveAttribute(
      "href",
      "https://example.com/job"
    );
  });

  it("calls onEdit when Edit is clicked", async () => {
    const user = userEvent.setup();
    const { onEdit } = setup();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(application);
  });

  it("calls onDelete when Delete is clicked", async () => {
    const user = userEvent.setup();
    const { onDelete } = setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(application);
  });

  it("calls onMove when the status dropdown changes", async () => {
    const user = userEvent.setup();
    const { onMove } = setup();
    await user.selectOptions(screen.getByLabelText("Change status"), "INTERVIEW");
    expect(onMove).toHaveBeenCalledWith("1", "INTERVIEW");
  });

  it("can be dragged", () => {
    setup();
    expect(screen.getByRole("article")).toHaveAttribute("draggable", "true");
  });
});