import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import BottomSheet from "./BottomSheet";
import { Button } from "./Button";

const meta: Meta<typeof BottomSheet> = {
  title: "Common/BottomSheet",
  component: BottomSheet,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BottomSheet>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>Open Sheet</Button>
        <BottomSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Actions"
          description="Choose an action below"
        >
          <div className="space-y-3">
            <button className="w-full border border-[#191919] rounded-xl p-4 flex items-center gap-4 text-left">
              <div className="flex-1">
                <div className="text-white font-semibold">View usage</div>
                <div className="text-gray-400 text-sm">See billing details</div>
              </div>
            </button>
            <button className="w-full border border-[#191919] rounded-xl p-4 flex items-center gap-4 text-left">
              <div className="flex-1">
                <div className="text-white font-semibold">Pause</div>
                <div className="text-gray-400 text-sm">Temporarily stop</div>
              </div>
            </button>
            <button className="w-full border border-[#191919] rounded-xl p-4 flex items-center gap-4 text-left">
              <div className="flex-1">
                <div className="text-[#FF6467] font-semibold">Cancel</div>
                <div className="text-[#FFA2A2B2] text-sm">End recurring payments</div>
              </div>
            </button>
          </div>
        </BottomSheet>
      </div>
    );
  },
};

export const NoTitle: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>Open Sheet</Button>
        <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <p className="text-white">Sheet with no title</p>
        </BottomSheet>
      </div>
    );
  },
};
