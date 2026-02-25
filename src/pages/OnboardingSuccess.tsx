import { Link } from 'react-router-dom';
import LandingNavbar from '../components/LandingNavbar';
import './OnboardingSuccess.css';

export default function OnboardingSuccess() {
    return (
        <div className="onboarding-success-page">
            <LandingNavbar />

            <main className="onboarding-success-content">
                <div className="success-icon-container">
                    <div className="success-icon-ring" />
                    <svg
                        className="success-checkmark"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>

                <h1 className="success-title">You're all set!</h1>
                <p className="success-subtitle">
                    Welcome to Stellabill. Create your first plan to start accepting subscriptions.
                </p>

                <div className="success-actions">
                    <Link to="/plans/new" className="onboarding-btn-primary">
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
                        Create plan
                    </Link>
                    <Link to="/dashboard" className="onboarding-btn-secondary">
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
            </main>
        </div>
    );
}
