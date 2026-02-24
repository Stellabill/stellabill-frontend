import "./prepaidCard.css";
export const DollarIcon = ({ size = 20, color = "#00D3F2" }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={`${size}`} height={`${size}`} viewBox="0 0 20 20" fill="none">
            <path d="M10 1.6665V18.3332" stroke={color} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.1667 4.1665H7.91667C7.14312 4.1665 6.40125 4.47379 5.85427 5.02078C5.30729 5.56776 5 6.30962 5 7.08317C5 7.85672 5.30729 8.59858 5.85427 9.14557C6.40125 9.69255 7.14312 9.99984 7.91667 9.99984H12.0833C12.8569 9.99984 13.5987 10.3071 14.1457 10.8541C14.6927 11.4011 15 12.143 15 12.9165C15 13.6901 14.6927 14.4319 14.1457 14.9789C13.5987 15.5259 12.8569 15.8332 12.0833 15.8332H5" stroke={color} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}


export default function PrepaidBalanceCard({ balance = 30, maxBalance = 30, paymentAmount = 10, onTopUp }: {balance:number, maxBalance:number, paymentAmount:number, onTopUp:()=>void}) {
    const payments = Math.floor(balance / paymentAmount);
    const fillPct = Math.min((balance / maxBalance) * 100, 100);

    return (
            <div className="prepaid-card">
                <div className="prepaid-card__header">
                    <div className="prepaid-card__icon-box">
                        <DollarIcon size={20} color="#00D3F2" />
                    </div>
                    <span className="prepaid-card__title">Prepaid balance</span>
                </div>

                <div className="prepaid-card__balance-section">
                    <div className="prepaid-card__balance-row">
                        <span className="prepaid-card__balance-number">{balance}</span>
                        <span className="prepaid-card__balance-currency">USDC</span>
                    </div>

                    <span className="prepaid-card__coverage">
                        Covers approximately <strong>{payments}</strong> payments
                    </span>

                    <div className="prepaid-card__progress-wrapper">
                        <div
                            className="prepaid-card__progress-track"
                            role="progressbar"
                            aria-valuenow={balance}
                            aria-valuemin={0}
                            aria-valuemax={maxBalance}
                            aria-label={`Balance: ${balance} USDC out of ${maxBalance} USDC`}
                        >
                            <div className="prepaid-card__progress-fill" style={{ width: `${fillPct}%` }} />
                        </div>
                        <div className="prepaid-card__progress-labels">
                            <span className="prepaid-card__progress-label">0 USDC</span>
                            <span className="prepaid-card__progress-label">{maxBalance} USDC</span>
                        </div>
                    </div>
                </div>

                <button className="prepaid-card__button" aria-label="Top up balance" onClick={onTopUp}>
                    <DollarIcon size={16} color="black" />
                    <span className="prepaid-card__button-text">Top up balance</span>
                </button>
            </div>
    );
}