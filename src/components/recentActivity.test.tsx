import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecentActivity } from "./recentActivity";
import styles from "./recentActivity.module.css";

const activityItems = [
  {
    id: "activity-1",
    type: "new_subscription" as const,
    details: "Pro plan",
    timestamp: "Just now",
    amount: "$20.00",
  },
  {
    id: "activity-2",
    type: "charge_succeeded" as const,
    details: "Monthly billing",
    timestamp: "Yesterday",
    amount: "$15.00",
  },
];

describe("RecentActivity", () => {
  it("renders the title, activity details, and type-specific amount", () => {
    render(<RecentActivity items={activityItems} title="Latest activity" />);

    expect(screen.getByRole("region", { name: "Latest activity" })).toBeInTheDocument();
    expect(screen.getByText("New subscription")).toBeInTheDocument();
    expect(screen.getByText("Pro plan")).toBeInTheDocument();
    expect(screen.getByText("+$20.00")).toBeInTheDocument();
    expect(screen.getByText("$15.00")).toBeInTheDocument();
  });

  it("limits the number of visible activities", () => {
    render(<RecentActivity items={activityItems} maxVisible={1} />);

    const list = screen.getByRole("list", { name: "Activity items" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByText("Charge succeeded")).not.toBeInTheDocument();
  });

  it("calls onViewAll when the view all button is activated", () => {
    const onViewAll = vi.fn();
    render(<RecentActivity items={[]} onViewAll={onViewAll} />);

    fireEvent.click(screen.getByRole("button", { name: "View all activity" }));

    expect(onViewAll).toHaveBeenCalledOnce();
  });

  it("renders loading skeletons while items are unresolved", () => {
    render(<RecentActivity />);

    const list = screen.getByRole("list", { name: "Activity items" });
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(within(list).getAllByRole("listitem", { hidden: true })).toHaveLength(5);
  });

  it("uses stylesheet classes instead of inline styles for static presentation", () => {
    const { container } = render(<RecentActivity items={activityItems} />);

    expect(container.firstElementChild).not.toHaveAttribute("style");
    expect(screen.getByText("New subscription").closest("li")).not.toHaveAttribute("style");
    expect(screen.getByText("New subscription").closest("li")).toHaveClass(styles.activityItem);
  });
});
