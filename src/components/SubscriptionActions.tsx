import React from "react";
import { Activity, ChevronRight, Pause, XCircle } from "lucide-react";

interface SubscriptionActionsProps {
  hasUsageBilling?: boolean;
  isPaused?: boolean;
  onViewUsage?: () => void;
  onPauseSubscription?: () => void;
  onCancelSubscription?: () => void;
}

function SubscriptionActions({
  hasUsageBilling = true,
  isPaused = false,
  onViewUsage,
  onPauseSubscription,
  onCancelSubscription,
}: SubscriptionActionsProps) {
  const handleViewUsage = (): void => {
    if (onViewUsage) {
      onViewUsage();
    }
  };

  const handlePauseClick = (): void => {};

  const handleCancelClick = (): void => {};

  return (
    <>
      <div className="w-full max-w-md mx-auto bg-[#000000] rounded-2xl p-6 border border-[#191919]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#191919] p-1 rounded-md">
            <Activity className="w-5 h-5 text-[#90A1B9]" strokeWidth={2} />
          </div>
          <h2 className="text-white font-bold text-lg">Actions</h2>
        </div>

        {/* Action Items Container */}
        <div className="space-y-3">
          {/* View Usage - Only show if plan has usage-based billing */}
          {hasUsageBilling && (
            <button
              onClick={handleViewUsage}
              className="w-full  border border-[#191919] rounded-xl p-4 flex items-center gap-4  transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
              aria-label="View usage-based billing details"
            >
              <div className="shrink-0">
                <Activity className="w-5 h-5 text-[#00D3F2]" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-semibold">View usage</div>
                <div className="text-gray-400 text-sm">
                  See usage-based billing details
                </div>
              </div>
              <div className="shrink-0">
                <ChevronRight
                  className="w-5 h-5 text-gray-400"
                  strokeWidth={2}
                />
              </div>
            </button>
          )}

          {/* Pause Subscription */}
          <button
            onClick={handlePauseClick}
            disabled={isPaused}
            className={`w-full  border border-gray-700 rounded-xl p-4 flex items-center gap-4 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFB900] focus:ring-offset-2 focus:ring-offset-zinc-900 ${
              isPaused ? "opacity-50 cursor-not-allowed" : " cursor-pointer"
            }`}
            aria-label="Pause subscription to temporarily stop billing"
            aria-disabled={isPaused}
          >
            <div className="shrink-0">
              <Pause className="w-5 h-5 text-[#FFB900]" strokeWidth={2} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-white font-semibold">Pause subscription</div>
              <div className="text-gray-400 text-sm">
                Temporarily stop billing
              </div>
            </div>
          </button>

          {/* Cancel Subscription */}
          <button
            onClick={handleCancelClick}
            className="w-full  border border-[#FB2C364D] rounded-xl p-4 flex items-center gap-4  transition-colors focus:outline-none focus:ring-2 focus:ring-[#FB2C364D] focus:ring-offset-2 focus:ring-offset-zinc-900"
            aria-label="Cancel subscription to end recurring payments"
          >
            <div className="shrink-0">
              <XCircle className="w-5 h-5 text-[#FF6467]" strokeWidth={2} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[#FF6467] font-semibold">
                Cancel subscription
              </div>
              <div className="text-[#FFA2A2B2] text-sm">
                End recurring payments
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

export default SubscriptionActions;
