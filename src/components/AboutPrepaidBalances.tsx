import React, { useId, useMemo, useState } from "react";
import {
  Wallet,
  ArrowDownCircle,
  BellRing,
  ChevronDown,
  Search,
  DollarSign,
} from "lucide-react";
import "./AboutPrepaidBalances.css";

/* Timeline tokens shared with PlanStatusTimeline visual language */
export type PrepaidTimelineStep =
  | "top-up"
  | "draw-down"
  | "low-balance";

export interface PrepaidTimelineEvent {
  id: string;
  step: PrepaidTimelineStep;
  title: string;
  description: string;
  timestamp: string;
}

export interface FaqItem {
  id: string;
  group: string;
  question: string;
  answer: string;
}

const TIMELINE_EVENTS: PrepaidTimelineEvent[] = [
  {
    id: "t1",
    step: "top-up",
    title: "Top up your vault",
    description:
      "Deposit USDC into the prepaid vault. Funds stay in a smart contract until your billing cycle needs them.",
    timestamp: "Anytime",
  },
  {
    id: "t2",
    step: "draw-down",
    title: "Balance draw-down",
    description:
      "On each billing cycle, Stellabill automatically deducts the plan price and any usage charges from your vault.",
    timestamp: "Billing cycle",
  },
  {
    id: "t3",
    step: "low-balance",
    title: "Low-balance alerts",
    description:
      "When coverage drops below one cycle, you get a polite alert so you can top up before service pauses.",
    timestamp: "As needed",
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "f1",
    group: "Getting started",
    question: "What is a prepaid vault?",
    answer:
      "A prepaid vault is a smart-contract balance that holds USDC for your subscriptions. Payments are drawn automatically on each billing cycle so you do not need to approve every charge.",
  },
  {
    id: "f2",
    group: "Getting started",
    question: "How do I top up?",
    answer:
      "Open Top up from your subscription or wallet panel, choose an amount (or a quick-select coverage option), review the new balance and coverage, then confirm the transfer from your Stellar wallet.",
  },
  {
    id: "f3",
    group: "Billing",
    question: "When is balance drawn down?",
    answer:
      "Draw-down happens at the start of each billing period for the plan price, plus any metered usage accrued in the prior period. Failed draw-downs pause the subscription until you top up.",
  },
  {
    id: "f4",
    group: "Billing",
    question: "What happens if my balance is too low?",
    answer:
      "You receive a low-balance alert before coverage ends. If the vault cannot cover the next cycle, the subscription pauses gracefully and resumes after a successful top-up.",
  },
  {
    id: "f5",
    group: "Security",
    question: "Who controls the vault funds?",
    answer:
      "Funds remain in the on-chain vault under your subscription contract. Stellabill can only deduct scheduled plan and usage amounts — not arbitrary withdrawals.",
  },
];

const STEP_META: Record<
  PrepaidTimelineStep,
  { icon: typeof Wallet; color: string; label: string }
> = {
  "top-up": { icon: Wallet, color: "#34d399", label: "Top-up" },
  "draw-down": { icon: ArrowDownCircle, color: "#60a5fa", label: "Draw-down" },
  "low-balance": { icon: BellRing, color: "#fbbf24", label: "Alert" },
};

export interface AboutPrepaidBalancesProps {
  timeline?: PrepaidTimelineEvent[];
  faqs?: FaqItem[];
  onTopUp?: () => void;
  topUpHref?: string;
}

function TimelineItem({
  event,
  isLast,
}: {
  event: PrepaidTimelineEvent;
  isLast: boolean;
}) {
  const meta = STEP_META[event.step];
  const Icon = meta.icon;

  return (
    <li className="prepaid-timeline__item" role="listitem">
      {!isLast && (
        <div className="prepaid-timeline__connector" aria-hidden="true" />
      )}
      <div
        className="prepaid-timeline__icon"
        style={{ color: meta.color }}
        aria-hidden="true"
      >
        <Icon size={16} />
      </div>
      <div className="prepaid-timeline__body">
        <div className="prepaid-timeline__meta">
          <p className="prepaid-timeline__title">{event.title}</p>
          <time className="prepaid-timeline__time">{event.timestamp}</time>
        </div>
        <span className="prepaid-timeline__badge">{meta.label}</span>
        <p className="prepaid-timeline__desc">{event.description}</p>
      </div>
    </li>
  );
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const baseId = useId();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q),
    );
  }, [items, query]);

  const groups = useMemo(() => {
    return filtered.reduce<Record<string, FaqItem[]>>((acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <section className="prepaid-faq" aria-labelledby={`${baseId}-faq-heading`}>
      <div className="prepaid-faq__header">
        <h3 id={`${baseId}-faq-heading`} className="prepaid-faq__title">
          Frequently asked questions
        </h3>
        <label className="prepaid-faq__search">
          <Search size={16} aria-hidden="true" />
          <span className="prepaid-sr-only">Search FAQ</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            aria-controls={`${baseId}-faq-list`}
          />
        </label>
      </div>

      <div id={`${baseId}-faq-list`}>
        {Object.keys(groups).length === 0 ? (
          <p className="prepaid-faq__empty" role="status">
            No questions match “{query}”.
          </p>
        ) : (
          Object.entries(groups).map(([group, groupItems]) => (
            <div key={group} className="prepaid-faq__group">
              <h4 className="prepaid-faq__group-title">{group}</h4>
              <ul className="prepaid-faq__list" role="list">
                {groupItems.map((item) => {
                  const panelId = `${baseId}-panel-${item.id}`;
                  const expanded = openId === item.id;
                  return (
                    <li key={item.id} className="prepaid-faq__item">
                      <button
                        type="button"
                        className="prepaid-faq__trigger"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        id={`${baseId}-trigger-${item.id}`}
                        onClick={() =>
                          setOpenId((current) =>
                            current === item.id ? null : item.id,
                          )
                        }
                      >
                        <span>{item.question}</span>
                        <ChevronDown
                          size={18}
                          className={`prepaid-faq__chevron${expanded ? " prepaid-faq__chevron--open" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={`${baseId}-trigger-${item.id}`}
                        hidden={!expanded}
                        className="prepaid-faq__panel"
                      >
                        <p>{item.answer}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const AboutPrepaidBalances: React.FC<AboutPrepaidBalancesProps> = ({
  timeline = TIMELINE_EVENTS,
  faqs = FAQ_ITEMS,
  onTopUp,
  topUpHref = "/subscriptions",
}) => {
  return (
    <section className="about-prepaid-section">
      <div className="prepaid-explainer">
        <article className="prepaid-card">
          <div className="prepaid-icon-container">
            <DollarSign className="prepaid-icon" size={20} aria-hidden="true" />
          </div>
          <div className="prepaid-content text-left">
            <h2 className="prepaid-title">About prepaid balances</h2>
            <p className="prepaid-body">
              Each subscription uses a prepaid vault model. Your USDC balance is
              held securely in a smart contract, and payments are automatically
              deducted on your billing cycle. You can top up anytime to extend
              coverage.
            </p>
          </div>
        </article>

        <section
          className="prepaid-timeline"
          aria-labelledby="prepaid-timeline-heading"
        >
          <div className="prepaid-timeline__intro">
            <h3
              id="prepaid-timeline-heading"
              className="prepaid-timeline__heading"
            >
              How prepaid balances work
            </h3>
            <p className="prepaid-timeline__sub">
              A visual path from top-up through draw-down to low-balance alerts.
            </p>
          </div>
          <ol className="prepaid-timeline__list" role="list">
            {timeline.map((event, index) => (
              <TimelineItem
                key={event.id}
                event={event}
                isLast={index === timeline.length - 1}
              />
            ))}
          </ol>
        </section>

        <FaqAccordion items={faqs} />

        <div
          className="prepaid-cta"
          role="region"
          aria-label="Top up call to action"
        >
          {onTopUp ? (
            <button
              type="button"
              className="prepaid-cta__button"
              onClick={onTopUp}
            >
              Top up now
            </button>
          ) : (
            <a className="prepaid-cta__button" href={topUpHref}>
              Top up now
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default AboutPrepaidBalances;
