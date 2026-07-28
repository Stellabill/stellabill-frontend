import "./MerchantDashboard.css";
import wallet from "./assets/Icon (8).svg";
import clock from "./assets/Icon (7).svg";
import dollar from "./assets/Icon (6).svg";
import pumpArrow from "./assets/Icon (5).svg";
import user from "./assets/Icon (4).svg";
import RevenueSplitByPlanPanel from "./Dashboard/RevenueSplitByPlanPanel";
import type { PlanRevenueSlice } from "./Dashboard/revenueSplitUtils";

const MOCK_PLAN_REVENUE: PlanRevenueSlice[] = [
  { planId: "basic", planName: "Basic", revenue: 320, previousRevenue: 290 },
  { planId: "pro", planName: "Pro", revenue: 720, previousRevenue: 680 },
  { planId: "enterprise", planName: "Enterprise", revenue: 200, previousRevenue: 150 },
];

export default function MerchantDashboard() {
  return (
    <>
      <section className="dashboard">
        <div className="card">
          <div className="flex">
            <div>
              <img src={user} alt="" />
            </div>
            <span>
              <img src={pumpArrow} alt="" /> +3
            </span>
          </div>
          <p>Active subscriptions</p>
          <h1>24</h1>
          <p className="stats">+3 this month</p>
        </div>
        <div className="card">
          <div className="flex">
            <div>
              <img src={dollar} alt="" />
            </div>
            <span>
              <img src={pumpArrow} alt="" /> +12%
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
              <img src={clock} alt="" />
            </div>
          </div>
          <p>Pending charges</p>
          <h1>5</h1>
          <p className="stats">150 USDC total</p>
        </div>
        <div className="card">
          <div className="flex">
            <div>
              <img src={wallet} alt="" />
            </div>
          </div>
          <p>Available to withdraw</p>
          <h1>
            800 <span>usdc</span>
          </h1>
          <button type="button">Withdraw</button>
        </div>
      </section>

      <div className="merchant-revenue-split">
        <RevenueSplitByPlanPanel
          plans={MOCK_PLAN_REVENUE}
          periodLabel="this month"
          previousPeriodLabel="vs last month"
        />
      </div>
    </>
  );
}
