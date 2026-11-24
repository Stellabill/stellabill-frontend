import type { Meta, StoryObj } from "@storybook/react";
import RevenueSplitByPlanPanel from "./RevenueSplitByPlanPanel";
import type { PlanRevenueSlice } from "./revenueSplitUtils";

const MOCK_PLAN_REVENUE: PlanRevenueSlice[] = [
  { planId: "basic", planName: "Basic", revenue: 320, previousRevenue: 290 },
  { planId: "pro", planName: "Pro", revenue: 720, previousRevenue: 680 },
  { planId: "enterprise", planName: "Enterprise", revenue: 200, previousRevenue: 150 },
];

const meta: Meta<typeof RevenueSplitByPlanPanel> = {
  title: "Dashboard/RevenueSplitByPlanPanel",
  component: RevenueSplitByPlanPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof RevenueSplitByPlanPanel>;

export const Default: Story = {
  args: {
    plans: MOCK_PLAN_REVENUE,
    periodLabel: "this month",
    previousPeriodLabel: "vs last month",
  },
};

export const Empty: Story = {
  args: {
    plans: [],
    periodLabel: "this month",
    previousPeriodLabel: "vs last month",
  },
};
