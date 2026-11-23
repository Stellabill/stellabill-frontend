import { formatDisplayAmount } from "./topUpAmount";

export interface QuickSelectOption {
  id: string;
  duration: string;
  amount: number;
}

interface TopUpQuickSelectProps {
  options: QuickSelectOption[];
  selectedOption: string | null;
  currency: string;
  onSelect: (id: string, amount: number) => void;
}

export default function TopUpQuickSelect({
  options,
  selectedOption,
  currency,
  onSelect,
}: TopUpQuickSelectProps) {
  return (
    <div>
      <span className="section-label">Quick select</span>
      <div className="quick-select-grid">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`quick-select-btn ${selectedOption === option.id ? "selected" : ""}`}
            onClick={() => onSelect(option.id, option.amount)}
          >
            <span className="qs-duration">{option.duration}</span>
            <span className="qs-amount">
              {formatDisplayAmount(option.amount)} {currency}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
