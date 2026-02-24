import "./TopUpBalanceModal.css";
import dollarsign from "./assets/dolllar.svg";
import close from "./assets/close.svg";
import arrow from "./assets/arrow.svg";
import dollar from "./assets/dollar-sign.svg";
import wallet from "./assets/wallet.svg";

export default function TopUpBalanceModal() {
    return (
        <>
            <section className="modal">
                <div className="modal-h">
                    <div className="dollar">
                        <img src={dollarsign} alt="dollar sign" />
                    </div>

                    <div className="close">
                        <img src={close} alt="close-icon" />
                    </div>
                </div>
                <h1>Top up balance</h1>
                <p>
                    Add USDC to your prepaid balance for <b>Premium Access</b>
                </p>
                <div className="bal">
                    <p>Current prepaid balance</p>
                    <p>
                        <b>30</b> USDC
                    </p>
                </div>
                <p>Quick select</p>
                <div className="price-category">
                    <div>
                        <p>1 month</p>
                        <p>
                            <span>10 USDC</span>
                        </p>
                    </div>
                    <div>
                        <p>3 months</p>
                        <p>
                            <span>30 USDC</span>
                        </p>
                    </div>
                    <div>
                        <p>6 months</p>
                        <p>
                            <span>60 USDC</span>
                        </p>
                    </div>
                </div>
                <form action="">
                    <label className="p" htmlFor="amount">
                        Amount (USDC)
                    </label>
                    <div>
                        <img src={dollar} alt="" />
                        <input
                            type=" num"
                            name="amount"
                            className="amount"
                            placeholder="0.00"
                        />
                        <p>USDC</p>
                    </div>
                    <div>
                        <img src={wallet} alt="" />
                        <input
                            type=" num"
                            name="amount"
                            className="wallet"
                            placeholder="Your wallet balance"
                        />
                        <p>
                            <b>150 USDC</b>
                        </p>
                    </div>
                    <div className="buttons">
                        <button type="button">Cancel</button>
                        <button type="button" className="submit-btn">
                            Top up <img src={arrow} alt="forward-arrow" />
                        </button>
                    </div>
                </form>
            </section>
        </>
    );
}
