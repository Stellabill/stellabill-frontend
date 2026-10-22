import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Gift, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import LandingNavbar from "../components/LandingNavbar";
import RedeemConfirmModal from "../components/RedeemConfirmModal";
import { normalizeGiftCode, validateGiftCode, type GiftDetails } from "../utils/giftCode";
import "./RedeemGift.css";

const MALFORMED_CODE_ERROR = "Please enter a valid gift code (e.g., GIFT-ABC123-XYZ789)";

function formatGiftDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RedeemGift() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");
  const [giftDetails, setGiftDetails] = useState<GiftDetails | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoValidatedCodeRef = useRef<string | null>(null);

  const validateCode = useCallback(async (codeToValidate: string) => {
    setIsValidating(true);
    setError("");

    try {
      const result = await validateGiftCode(codeToValidate);

      if (result.status === "ok") {
        setCode(result.code);
        setGiftDetails(result.giftDetails);
        setShowConfirmModal(true);
      } else if (result.status === "expired") {
        setError(`This gift code expired on ${formatGiftDate(result.expiredOn)}. Please contact the sender.`);
      } else if (result.status === "redeemed") {
        setError("This gift has already been redeemed.");
      } else if (result.reason === "malformed") {
        setError(MALFORMED_CODE_ERROR);
      } else {
        setError("This gift code is not recognized. Please check and try again.");
      }
    } catch {
      setError("Unable to validate gift code. Please check your connection and try again.");
    } finally {
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (!urlCode) return;

    const normalizedCode = normalizeGiftCode(urlCode) ?? urlCode;
    // StrictMode runs effects twice on mount; a code already validated must not start a second one.
    if (autoValidatedCodeRef.current === normalizedCode) return;
    autoValidatedCodeRef.current = normalizedCode;

    setCode(normalizedCode);
    void validateCode(normalizedCode);
  }, [searchParams, validateCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateCode(code);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCode(value);
    if (error) setError("");
  };

  const handleCodeBlur = () => {
    const normalizedCode = normalizeGiftCode(code);
    if (normalizedCode !== null) setCode(normalizedCode);
  };

  const handleRedemptionComplete = () => {
    navigate("/gift-redeem-success", {
      state: {
        planName: giftDetails?.planName,
        planTier: "Professional",
        durationMonths: giftDetails?.duration,
        expiresOn: giftDetails?.expiresOn,
        gifterName: giftDetails?.gifterName,
      },
    });
  };

  return (
    <div className="redeem-gift-page">
      <LandingNavbar />

      <main className="redeem-gift-content" role="main" aria-labelledby="redeem-title">
        <div className="redeem-gift-container">
          {/* Icon */}
          <div className="redeem-icon-container">
            <div className="redeem-icon-ring" />
            <Gift className="redeem-icon-gift" size={48} />
          </div>

          {/* Title */}
          <h1 id="redeem-title" className="redeem-title">
            Redeem Your Gift
          </h1>
          <p className="redeem-subtitle">
            Enter the code from your gift to unlock your subscription
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="redeem-form">
            <div className="redeem-form-group">
              <label htmlFor="gift-code" className="sr-only">
                Gift code
              </label>
              <input
                ref={inputRef}
                id="gift-code"
                type="text"
                className={`redeem-input ${error ? "error" : ""}`}
                placeholder="GIFT-"
                value={code}
                onChange={handleCodeChange}
                onBlur={handleCodeBlur}
                disabled={isValidating}
                aria-invalid={!!error}
                aria-describedby={error ? "code-error" : "code-hint"}
                autoFocus
              />
              {error ? (
                <div id="code-error" className="redeem-error" role="alert">
                  <AlertCircle size={16} />
                  {error}
                </div>
              ) : (
                <div id="code-hint" className="redeem-hint">
                  Example: GIFT-ABC123-XYZ789
                </div>
              )}
            </div>

            <button
              type="submit"
              className="redeem-submit-btn"
              disabled={isValidating || !code.trim()}
            >
              {isValidating ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Validating...
                </>
              ) : (
                <>
                  Redeem gift
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Alternative */}
          <div className="redeem-alternative">
            <p>Don't have a code?</p>
            <button
              type="button"
              className="redeem-browse-link"
              onClick={() => navigate("/browse-plans")}
            >
              Browse plans
            </button>
          </div>

          {/* Info Section */}
          <div className="redeem-info-section">
            <div className="redeem-divider">
              <span>How it works</span>
            </div>

            <ol className="redeem-steps-list">
              <li className="redeem-step-item">
                <div className="redeem-step-number">1</div>
                <div className="redeem-step-content">
                  <h3 className="redeem-step-title">Enter your gift code</h3>
                  <p className="redeem-step-desc">
                    Type or paste the code you received from the gift sender
                  </p>
                </div>
              </li>
              <li className="redeem-step-item">
                <div className="redeem-step-number">2</div>
                <div className="redeem-step-content">
                  <h3 className="redeem-step-title">Review the details</h3>
                  <p className="redeem-step-desc">
                    Check the subscription plan, duration, and start date
                  </p>
                </div>
              </li>
              <li className="redeem-step-item">
                <div className="redeem-step-number">3</div>
                <div className="redeem-step-content">
                  <h3 className="redeem-step-title">Activate your gift</h3>
                  <p className="redeem-step-desc">
                    Confirm to start your subscription immediately
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </main>

      {/* Redemption Confirmation Modal */}
      {giftDetails && (
        <RedeemConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          giftDetails={giftDetails}
          giftCode={code}
          onRedemptionComplete={handleRedemptionComplete}
        />
      )}
    </div>
  );
}
