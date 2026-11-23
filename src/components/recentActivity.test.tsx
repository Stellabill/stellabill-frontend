import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecentActivity } from "./recentActivity";
import styles from "./recentActivity.module.css";

const allTypeItems = [
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
    timestamp: "1 hour ago",
    amount: "$15.00",
  },
  {
    id: "activity-3",
    type: "subscription_paused" as const,
    details: "Starter plan",
    timestamp: "Yesterday",
    amount: "$10.00",
  },
  {
    id: "activity-4",
    type: "subscription_resumed" as const,
    details: "Team plan",
    timestamp: "2 days ago",
    amount: "$50.00",
  },
  {
    id: "activity-5",
    type: "subscription_cancelled" as const,
    details: "Basic plan",
    timestamp: "Last week",
    amount: "$5.00",
  },
];

describe("RecentActivity", () => {
  it("renders skeleton rows and aria-busy=true when items is null", () => {
    render(<RecentActivity items={null} />);

    const list = screen.getByRole("list", { name: "Activity items" });
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(within(list).getAllByRole("listitem", { hidden: true })).toHaveLength(5);
  });

  it("defaults to loading state when items prop is omitted", () => {
    render(<RecentActivity />);

    const list = screen.getByRole("list", { name: "Activity items" });
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(within(list).getAllByRole("listitem", { hidden: true })).toHaveLength(5);
  });

  it("renders the label, icon aria-label, details, timestamp, and formatted amount for each activity type", () => {
    render(<RecentActivity items={allTypeItems} title="Latest activity" />);

    expect(screen.getByRole("region", { name: "Latest activity" })).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Activity items" });
    expect(list).toHaveAttribute("aria-busy", "false");
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);

    expect(screen.getByText("New subscription")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "New subscription icon" })).toBeInTheDocument();
    expect(screen.getByText("Pro plan")).toBeInTheDocument();
    expect(screen.getByText("Just now")).toBeInTheDocument();
    expect(screen.getByText("+$20.00")).toBeInTheDocument();

    expect(screen.getByText("Charge succeeded")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Charge succeeded icon" })).toBeInTheDocument();
    expect(screen.getByText("Monthly billing")).toBeInTheDocument();
    expect(screen.getByText("$15.00")).toBeInTheDocument();

    expect(screen.getByText("Subscription paused")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Subscription paused icon" })).toBeInTheDocument();
    expect(screen.getByText("Starter plan")).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument();

    expect(screen.getByText("Subscription resumed")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Subscription resumed icon" })).toBeInTheDocument();
    expect(screen.getByText("Team plan")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();

    expect(screen.getByText("Subscription cancelled")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Subscription cancelled icon" })).toBeInTheDocument();
    expect(screen.getByText("Basic plan")).toBeInTheDocument();
    expect(screen.getByText("$5.00")).toBeInTheDocument();
  });

  it("renders only maxVisible items", () => {
    render(<RecentActivity items={allTypeItems} maxVisible={2} />);

    const list = screen.getByRole("list", { name: "Activity items" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("New subscription")).toBeInTheDocument();
    expect(screen.getByText("Charge succeeded")).toBeInTheDocument();
    expect(screen.queryByText("Subscription paused")).not.toBeInTheDocument();
  });

  it("defaults maxVisible to 8 items", () => {
    const tenItems = Array.from({ length: 10 }, (_, idx) => ({
      id: `item-${idx}`,
      type: "charge_succeeded" as const,
      details: `Invoice #${idx + 1}`,
      timestamp: "Today",
      amount: "$10.00",
    }));

    render(<RecentActivity items={tenItems} />);

    const list = screen.getByRole("list", { name: "Activity items" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(8);
    expect(screen.queryByText("Invoice #9")).not.toBeInTheDocument();
  });

  it("calls onViewAll when the view-all button is clicked", async () => {
    const user = userEvent.setup();
    const onViewAll = vi.fn();
    render(<RecentActivity items={allTypeItems} onViewAll={onViewAll} />);

    await user.click(screen.getByRole("button", { name: "View all activity" }));

    expect(onViewAll).toHaveBeenCalledOnce();
  });

  it("renders an empty list with aria-busy=false when items is an empty array", () => {
    render(<RecentActivity items={[]} />);

    const list = screen.getByRole("list", { name: "Activity items" });
    expect(list).toHaveAttribute("aria-busy", "false");
    expect(within(list).queryAllByRole("listitem")).toHaveLength(0);
  });

  it("uses stylesheet classes instead of inline styles for static presentation", () => {
    const { container } = render(<RecentActivity items={allTypeItems} />);

    expect(container.firstElementChild).not.toHaveAttribute("style");
    expect(screen.getByText("New subscription").closest("li")).not.toHaveAttribute("style");
    expect(screen.getByText("New subscription").closest("li")).toHaveClass(styles.activityItem);
  });
});
