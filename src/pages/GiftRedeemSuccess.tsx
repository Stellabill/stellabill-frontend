import { Link, useLocation } from "react-router-dom";
import LandingNavbar from "../components/LandingNavbar";
import "./GiftRedeemSuccess.css";

interface GiftRedeemState {
  planName?: string;
  planTier?: string;
  durationMonths?: number;
  expiresOn?: string;
  gifterName?: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function GiftRedeemSuccess() {
  const location = useLocation();
  const state = (location.state as GiftRedeemState) || {};

  const planName = state.planName || "Stellabill Pro";
  const planTier = state.planTier || "Professional";
  const durationMonths = state.durationMonths || 12;
  const expiresOn =
    state.expiresOn ||
    formatDate(
      new Date(
        Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    );
  const gifterName = state.gifterName;

  return (
    <div className="gift-redeem-success-page">
      <LandingNavbar />

      <main
        className="gift-redeem-success-content"
        role="main"
        aria-labelledby="gift-success-title"
      >
        <div className="gift-success-icon-container">
          <div className="gift-success-icon-ring" />
          <svg
            className="gift-success-gift"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 12 20 22 4 22 4 12" />
            <rect x="2" y="7" width="20" height="5" />
            <line x1="12" y1="22" x2="12" y2="7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        </div>

        <h1 id="gift-success-title" className="gift-success-title">
          Gift redeemed!
        </h1>
        <p className="gift-success-subtitle">
          {gifterName
            ? `${gifterName} has gifted you a subscription. Welcome to Stellabill.`
            : "Your gift subscription has been activated. Welcome to Stellabill."}
        </p>

        <section
          className="gift-plan-summary-card"
          aria-labelledby="plan-summary-heading"
        >
          <h2 id="plan-summary-heading" className="gift-plan-summary-heading">
            Your gift subscription
          </h2>

          <dl className="gift-plan-details">
            <div className="gift-plan-detail-item">
              <dt className="gift-plan-detail-label">Plan</dt>
              <dd className="gift-plan-detail-value">{planName}</dd>
            </div>
            <div className="gift-plan-detail-item">
              <dt className="gift-plan-detail-label">Tier</dt>
              <dd className="gift-plan-detail-value">
                <span className="gift-tier-badge">{planTier}</span>
              </dd>
            </div>
            <div className="gift-plan-detail-item">
              <dt className="gift-plan-detail-label">Duration</dt>
              <dd className="gift-plan-detail-value">
                {durationMonths} month{durationMonths !== 1 ? "s" : ""}
              </dd>
            </div>
            <div className="gift-plan-detail-item gift-plan-detail-item--expiry">
              <dt className="gift-plan-detail-label">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="gift-expiry-icon"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Expires on
              </dt>
              <dd
                className="gift-plan-detail-value gift-expiry-value"
                aria-live="polite"
              >
                {expiresOn}
              </dd>
            </div>
          </dl>

          <p className="gift-expiry-hint" role="note">
            After expiration, you can continue by adding a payment method. No
            charges will be made without confirmation.
          </p>
        </section>

        <section
          className="gift-first-steps"
          aria-labelledby="first-steps-heading"
        >
          <h2 id="first-steps-heading" className="gift-first-steps-heading">
            What's next
          </h2>

          <ol className="gift-steps-list">
            <li className="gift-step-item">
              <div className="gift-step-number" aria-hidden="true">
                1
              </div>
              <div className="gift-step-content">
                <h3 className="gift-step-title">Explore your dashboard</h3>
                <p className="gift-step-desc">
                  Get an overview of your subscriptions, revenue, and customer
                  activity.
                </p>
              </div>
            </li>
            <li className="gift-step-item">
              <div className="gift-step-number" aria-hidden="true">
                2
              </div>
              <div className="gift-step-content">
                <h3 className="gift-step-title">Set up your first plan</h3>
                <p className="gift-step-desc">
                  Create pricing plans with flexible billing, tiers, and
                  usage-based models.
                </p>
              </div>
            </li>
            <li className="gift-step-item">
              <div className="gift-step-number" aria-hidden="true">
                3
              </div>
              <div className="gift-step-content">
                <h3 className="gift-step-title">Configure payout settings</h3>
                <p className="gift-step-desc">
                  Connect your wallet so you're ready to receive subscription
                  payments.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <div className="gift-success-actions">
          <Link to="/plans/new" className="gift-btn-primary">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Create your first plan
          </Link>
          <Link to="/dashboard" className="gift-btn-secondary">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go to dashboard
          </Link>
        </div>

        <div className="gift-secondary-links">
          <Link to="/browse-plans" className="gift-link-secondary">
            Browse available plans
          </Link>
          <Link to="/settings" className="gift-link-secondary">
            Update payout settings
          </Link>
        </div>
      </main>
    </div>
  );
}
