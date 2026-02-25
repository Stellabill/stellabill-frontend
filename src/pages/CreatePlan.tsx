<<<<<<< detail-section
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './CreatePlan.module.css';
import LandingNavbar from '@/components/LandingNavbar';
import Footer from '@/components/Footer';

export default function CreatePlan() {
  const navigate = useNavigate();

  return (
 <div className={styles.main} >
   <LandingNavbar />
     <div className={styles.container}>
      <nav className={styles.breadcrumb}>
        <Link to="/plans" className={styles.breadcrumbLink}>Plans</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>Create plan</span>
      </nav>

      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <h1 className={styles.title}>Create plan</h1>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Details</h2>
          
          <div className={styles.field}>
            <label htmlFor="plan-name" className={styles.label}>
              Plan name <span className={styles.required}>*</span>
            </label>
            <input 
              type="text" 
              id="plan-name" 
              className={styles.input} 
              placeholder="e.g., Pro Plan" 
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="plan-description" className={styles.label}>
              Description <span className={styles.optional}>(optional)</span>
            </label>
            <textarea 
              id="plan-description" 
              className={styles.textarea} 
              placeholder="Describe what's included in this plan..."
            />
          </div>
        </section>

        {/* Pricing Section Placeholder */}
        <section className={styles.sectionDimmed}>
          <h2 className={styles.sectionTitle}>Pricing</h2>
          <div className={styles.placeholderBox}>Pricing fields will be implemented next.</div>
        </section>

        {/* Billing Type Section Placeholder */}
        <section className={styles.sectionDimmed}>
          <h2 className={styles.sectionTitle}>Billing type</h2>
          <div className={styles.placeholderBox}>Billing type options will be implemented next.</div>
        </section>

        <div className={styles.actions}>
          <button className={styles.createButton}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            Create plan
          </button>
          <button onClick={() => navigate('/plans')} className={styles.cancelButton}>
            Cancel
          </button>
        </div>
      </div>
    </div>
<Footer/>
 </div>
   ); 
=======
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PricingSection, { validatePricing, type PricingSectionValue } from '../components/PricingSection'
import BillingTypeSection from "../components/create-plan/BillingTypeSection";

export default function CreatePlan() {
  const navigate = useNavigate();
  const [usageEnabled, setUsageEnabled] = useState(false);
  const [trialDays, setTrialDays] = useState("");
  const [pricing, setPricing] = useState<PricingSectionValue>({ price: '', interval: '' })
  const [errors, setErrors] = useState<{ priceError?: string; intervalError?: string }>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      usage_enabled: usageEnabled,
      trial_period_days: trialDays === "" ? 0 : Number(trialDays),
    };
    console.log("Create plan payload:", payload);
    // Whatever handler function
  }

  return (
    <div style={{ padding: "2rem", background: "#0a0a0a", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", }}>
      <form onSubmit={handleSubmit} noValidate>
        <BillingTypeSection
          usageEnabled={usageEnabled}
          onUsageEnabledChange={setUsageEnabled}
          trialDays={trialDays}
          onTrialDaysChange={setTrialDays}
        />
        
        <div style={{ marginBottom: '1.5rem' }}>
          <PricingSection
            value={pricing}
            onChange={setPricing}
            priceError={errors.priceError}
            intervalError={errors.intervalError}
          />
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "0.875rem",
            marginTop: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          {/* Create plan button*/}
          <button
            type="submit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.6rem",
              background: "linear-gradient(135deg, #38bcd4 0%, #4dd8e1 100%)",
              border: "none",
              borderRadius: "8px",
              color: "#000",
              fontSize: "0.925rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.88";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Create plan
          </button>

          {/* Cancel button*/}
          <button
            type="button"
            onClick={() => navigate("/plans")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.75rem 1.6rem",
              background: "none",
              border: "1px solid #3a3a3a",
              borderRadius: "8px",
              color: "#e2e8f0",
              fontSize: "0.925rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#555";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#3a3a3a";
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
>>>>>>> main
}
