import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Store, Users, ArrowRight, RotateCcw } from "lucide-react";
import "./WelcomeScreen.css";

export type WelcomeRole = "merchant" | "subscriber";

export interface WelcomeScreenProps {
  /** Active user role. When missing, a chooser is shown. */
  role?: WelcomeRole | null;
  onContinue?: (role: WelcomeRole) => void;
  onSkip?: () => void;
  className?: string;
}

const ROLE_COPY: Record<
  WelcomeRole,
  {
    title: string;
    body: string;
    cta: string;
    steps: { label: string; hint: string }[];
    Icon: typeof Store;
  }
> = {
  merchant: {
    title: "Welcome, merchant",
    body: "Set up your business profile, connect payouts, and publish your first plan in a few guided steps.",
    cta: "Start merchant setup",
    steps: [
      { label: "Business", hint: "Profile & brand" },
      { label: "Payout", hint: "Wallet & rails" },
      { label: "Review", hint: "Go live" },
    ],
    Icon: Store,
  },
  subscriber: {
    title: "Welcome, subscriber",
    body: "Browse plans, top up your prepaid vault, and track usage from a single calm dashboard.",
    cta: "Browse plans",
    steps: [
      { label: "Discover", hint: "Find a plan" },
      { label: "Top up", hint: "Fund coverage" },
      { label: "Track", hint: "Usage & bills" },
    ],
    Icon: Users,
  },
};

function WelcomeIllustration({ role }: { role: WelcomeRole }) {
  const reduceMotion = useReducedMotion();
  const Icon = ROLE_COPY[role].Icon;

  return (
    <motion.div
      className="welcome__illustration"
      aria-hidden="true"
      initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
      }
    >
      <div className={`welcome__orb welcome__orb--${role}`}>
        <Icon size={36} />
      </div>
    </motion.div>
  );
}

export default function WelcomeScreen({
  role: roleProp = null,
  onContinue,
  onSkip,
  className = "",
}: WelcomeScreenProps) {
  const [role, setRole] = useState<WelcomeRole | null>(roleProp ?? null);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    setRole(roleProp ?? null);
  }, [roleProp]);

  const copy = role ? ROLE_COPY[role] : null;

  if (skipped) {
    return (
      <section
        className={`welcome welcome--skipped ${className}`.trim()}
        aria-labelledby="welcome-skipped-heading"
      >
        <div className="welcome__box">
          <h1 id="welcome-skipped-heading">You're all set to explore</h1>
          <p>
            You skipped the intro. You can reopen it anytime for a quick
            refresher.
          </p>
          <div className="welcome__actions">
            <button
              type="button"
              className="welcome__btn welcome__btn--ghost"
              onClick={() => setSkipped(false)}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Return to intro
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!role) {
    return (
      <section
        className={`welcome welcome--chooser ${className}`.trim()}
        aria-labelledby="welcome-chooser-heading"
      >
        <div className="welcome__box">
          <h1 id="welcome-chooser-heading">Welcome to Stellabill</h1>
          <p>
            We could not detect your role. Choose how you want to get started —
            you can change this later in settings.
          </p>
          <div
            className="welcome__role-grid"
            role="group"
            aria-label="Choose role"
          >
            <button
              type="button"
              className="welcome__role-card"
              onClick={() => setRole("merchant")}
            >
              <Store size={22} aria-hidden="true" />
              <span>I am a merchant</span>
            </button>
            <button
              type="button"
              className="welcome__role-card"
              onClick={() => setRole("subscriber")}
            >
              <Users size={22} aria-hidden="true" />
              <span>I am a subscriber</span>
            </button>
          </div>
          <div className="welcome__actions">
            <button
              type="button"
              className="welcome__btn welcome__btn--ghost"
              onClick={() => {
                setSkipped(true);
                onSkip?.();
              }}
            >
              Skip intro
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`welcome welcome--${role} ${className}`.trim()}
      aria-labelledby="welcome-heading"
      data-role={role}
    >
      <WelcomeIllustration role={role} />

      <div className="welcome__box">
        <h1 id="welcome-heading">{copy!.title}</h1>
        <p>{copy!.body}</p>
      </div>

      <ol className="welcome__steps" aria-label={`${role} setup steps`}>
        {copy!.steps.map((step, index) => (
          <li key={step.label} className="welcome__step">
            <div
              className={`welcome__step-num${index === 0 ? " welcome__step-num--active" : ""}`}
            >
              {index + 1}
            </div>
            {index < copy!.steps.length - 1 && (
              <span className="welcome__step-rail" aria-hidden="true" />
            )}
            <div className="welcome__step-copy">
              <span className="welcome__step-label">{step.label}</span>
              <span className="welcome__step-hint">{step.hint}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="welcome__actions">
        <button
          type="button"
          className="welcome__btn welcome__btn--primary"
          onClick={() => onContinue?.(role)}
        >
          {copy!.cta}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="welcome__btn welcome__btn--ghost"
          onClick={() => {
            setSkipped(true);
            onSkip?.();
          }}
        >
          Skip intro
        </button>
      </div>
    </section>
  );
}
