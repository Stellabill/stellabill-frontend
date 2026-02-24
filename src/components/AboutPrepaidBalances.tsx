import React from "react";
import { DollarSign } from "lucide-react";
import "./AboutPrepaidBalances.css";

const AboutPrepaidBalances: React.FC = () => {
  return (
    <section className="about-prepaid-section">
      <article className="prepaid-card">
        <div className="prepaid-icon-container">
          <DollarSign className="prepaid-icon" size={20} />
        </div>
        <div className="prepaid-content text-left">
          <h3 className="prepaid-title">About prepaid balances</h3>
          <p className="prepaid-body">
            Each subscription uses a prepaid vault model. Your USDC balance is
            held securely in a smart contract, and payments are automatically
            deducted on your billing cycle. You can top up anytime to extend
            coverage.
          </p>
        </div>
      </article>
    </section>
  );
};

export default AboutPrepaidBalances;
