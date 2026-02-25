import "./MerchantDashboard.css";
import wallet from "./assets/Icon (8).svg";
import clock from "./assets/Icon (7).svg";
import dollar from "./assets/Icon (6).svg";
import pumpArrow from "./assets/Icon (5).svg";
import user from "./assets/Icon (4).svg";

export default function MerchantDashboard() {
    return (
        <>
            <section className="dashboard">
                <div className="card">
                    <div className="flex">
                        <div>
                            <img src={user} alt="user-profile" />
                        </div>
                        <span>
                            <img src={pumpArrow} alt="arrow" /> +3
                        </span>
                    </div>
                    <p>Active subscriptions</p>
                    <h1>24</h1>
                    <p className="stats">+3 this month</p>
                </div>
                <div className="card">
                    <div className="flex">
                        <div>
                            <img src={dollar} alt="dollar-sign" />
                        </div>
                        <span>
                            <img src={pumpArrow} alt="arrow" /> +12%
                        </span>
                    </div>
                    <p>MRR</p>
                    <h1>
                        1,240 <span>usdc</span>
                    </h1>
                    <p className="stats">Monthly recurring revenue</p>
                </div>
                <div className="card">
                    <div className="flex">
                        <div>
                            <img src={clock} alt="clock-icon" />
                        </div>
                    </div>
                    <p>Pending charges</p>
                    <h1>5</h1>
                    <p className="stats">150 USDC total</p>
                </div>
                <div className="card">
                    <div className="flex">
                        <div>
                            <img src={wallet} alt="wallet-icon" />
                        </div>
                    </div>
                    <p>Available to withdraw</p>
                    <h1>
                        800 <span>usdc</span>
                    </h1>
                    <button type="button">Withdraw</button>
                </div>
            </section>
        </>
    );
}
