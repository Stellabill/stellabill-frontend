import React, { useState, useId } from 'react';
import { Sparkles, HelpCircle, X, ArrowRight, Check } from 'lucide-react';

interface PlanRecommendationBannerProps {
  currentPlan: string;
  recommendedPlan: string;
  currentLimit: number;
  recommendedLimit: number;
  costDelta: string;
  currency: string;
  consecutiveMonthsOverThreshold?: number;
  thresholdPct?: number;
  onUpgrade?: () => void;
  className?: string;
}

export default function PlanRecommendationBanner({
  currentPlan,
  recommendedPlan = "Scale Tier",
  currentLimit,
  recommendedLimit = 150000,
  costDelta = "+$29/mo",
  currency = "USDC",
  consecutiveMonthsOverThreshold = 2,
  thresholdPct = 80,
  onUpgrade,
  className = "",
}: PlanRecommendationBannerProps) {
  const popoverId = useId();
  const dismissKey = `stellabill:plan-recommendation-dismissed:${currentPlan}`;
  
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissKey) === 'true';
    } catch {
      return false;
    }
  });

  const [showPopover, setShowPopover] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeComplete, setUpgradeComplete] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(dismissKey, 'true');
    } catch {
      // localStorage unavailable
    }
  };

  const handleUpgradeClick = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      setIsUpgrading(false);
      setUpgradeComplete(true);
      if (onUpgrade) onUpgrade();
    }, 1000);
  };

  return (
    <div
      className={`plan-recommendation-banner border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/50 rounded-xl p-4 sm:p-5 shadow-lg backdrop-blur-sm transition-all duration-300 relative overflow-hidden ${className}`.trim()}
      role="region"
      aria-label="Plan upgrade recommendation"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5 sm:mt-0">
            <Sparkles size={20} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-base">Recommended Upgrade: {recommendedPlan}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {costDelta}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              Increase your monthly limit from <strong className="text-white">{currentLimit.toLocaleString()}</strong> to <strong className="text-white">{recommendedLimit.toLocaleString()}</strong> API calls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <div className="relative">
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => setShowPopover((prev) => !prev)}
              aria-expanded={showPopover}
              aria-controls={popoverId}
            >
              <HelpCircle size={14} aria-hidden="true" />
              <span>Why am I seeing this?</span>
            </button>

            {showPopover && (
              <div
                id={popoverId}
                className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-72 p-3.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 shadow-xl z-20"
                role="tooltip"
              >
                <div className="font-semibold text-white mb-1.5">Usage Threshold Reached</div>
                <p className="text-slate-300 leading-relaxed">
                  Your team has used over <strong>{thresholdPct}%</strong> of your {currentPlan} limit for <strong>{consecutiveMonthsOverThreshold} consecutive months</strong>. Upgrading prevents unexpected overage fees or rate-limiting.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUpgradeClick}
              disabled={isUpgrading || upgradeComplete}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
            >
              {upgradeComplete ? (
                <>
                  <Check size={16} aria-hidden="true" />
                  <span>Upgraded!</span>
                </>
              ) : isUpgrading ? (
                <span>Switching...</span>
              ) : (
                <>
                  <span>One-Click Switch</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Dismiss recommendation banner"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
