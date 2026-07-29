export const PREVIEW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Theme Preview</title>
<style>
  :root {
    --primary: #22d3ee;
    --secondary: #14b8a6;
    --bg: #020617;
    --surface: #0a0f16;
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --accent: #2dd4bf;
    --success: #34d399;
    --danger: #f87171;
    --font: 'DM Sans', 'Sora', sans-serif;
    --font-heading: 'Sora', 'DM Sans', sans-serif;
    --radius: 0.75rem;
    --border: rgba(148,163,184,0.16);
    --input-bg: rgba(148,163,184,0.10);
    --card-bg: #0a0f16;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    padding: 16px;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .preview-container {
    max-width: 480px;
    margin: 0 auto;
  }

  .view-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    background: var(--surface);
    border-radius: var(--radius);
    padding: 4px;
    border: 1px solid var(--border);
  }

  .view-tab {
    flex: 1;
    padding: 8px 12px;
    border: none;
    border-radius: calc(var(--radius) - 2px);
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .view-tab:hover {
    color: var(--text);
    background: rgba(148,163,184,0.08);
  }

  .view-tab.active {
    background: var(--card-bg);
    color: var(--primary);
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .view-panel {
    display: none;
  }

  .view-panel.active {
    display: block;
  }

  .card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 12px;
  }

  .card-title {
    font-family: var(--font-heading);
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text);
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-group label {
    display: block;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) - 2px);
    background: var(--input-bg);
    color: var(--text);
    font-family: var(--font);
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .form-input:focus {
    border-color: var(--primary);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: calc(var(--radius) - 2px);
    font-family: var(--font);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, opacity 0.15s ease;
  }

  .btn-primary {
    background: var(--primary);
    color: #02131a;
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  .btn-secondary {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
  }

  .btn-secondary:hover {
    background: rgba(148,163,184,0.08);
  }

  .btn-block {
    width: 100%;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }

  .kpi-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
  }

  .kpi-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }

  .kpi-value {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1.2;
  }

  .kpi-delta {
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: 2px;
  }

  .kpi-delta.positive {
    color: var(--success);
  }

  .kpi-delta.negative {
    color: var(--danger);
  }

  .receipt {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    text-align: center;
  }

  .receipt-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px dashed var(--border);
  }

  .receipt-merchant {
    font-family: var(--font-heading);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
  }

  .receipt-amount {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text);
    margin: 12px 0;
  }

  .receipt-amount .currency {
    font-size: 1rem;
    color: var(--text-muted);
  }

  .receipt-line {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .receipt-line .value {
    color: var(--text);
    font-weight: 500;
  }

  .receipt-total {
    display: flex;
    justify-content: space-between;
    padding: 10px 0 0;
    margin-top: 8px;
    border-top: 1px solid var(--border);
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
  }

  .receipt-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(52,211,153,0.16);
    color: var(--success);
    margin-top: 12px;
  }

  .divider {
    height: 1px;
    background: var(--border);
    margin: 12px 0;
  }
</style>
</head>
<body>
<div class="preview-container">
  <div class="view-tabs" role="tablist">
    <button class="view-tab active" role="tab" aria-selected="true" data-view="checkout">Checkout</button>
    <button class="view-tab" role="tab" aria-selected="false" data-view="dashboard">Dashboard</button>
    <button class="view-tab" role="tab" aria-selected="false" data-view="receipt">Receipt</button>
  </div>

  <div id="view-checkout" class="view-panel active" role="tabpanel">
    <div class="card">
      <div class="card-title">Complete your purchase</div>
      <div class="form-group">
        <label>Card number</label>
        <div class="form-input">4242 4242 4242 4242</div>
      </div>
      <div class="form-group">
        <label>Expiry</label>
        <div class="form-input">12/28</div>
      </div>
      <div class="form-group">
        <label>CVC</label>
        <div class="form-input">123</div>
      </div>
      <div class="divider"></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:0.9rem">
        <span style="color:var(--text-muted)">Pro Plan — Monthly</span>
        <span style="font-weight:600;color:var(--text)">$29.00</span>
      </div>
      <button class="btn btn-primary btn-block">Pay $29.00</button>
      <p style="text-align:center;margin-top:8px;font-size:0.75rem;color:var(--text-muted)">
        Secured by Stellabill
      </p>
    </div>
  </div>

  <div id="view-dashboard" class="view-panel" role="tabpanel">
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Revenue</div>
        <div class="kpi-value">$12,450</div>
        <div class="kpi-delta positive">+8.2%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Subscribers</div>
        <div class="kpi-value">1,342</div>
        <div class="kpi-delta positive">+12</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">MRR</div>
        <div class="kpi-value">$8.2k</div>
        <div class="kpi-delta positive">+5.4%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Churn</div>
        <div class="kpi-value">2.1%</div>
        <div class="kpi-delta negative">-0.3%</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Recent transactions</div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:0.85rem;color:var(--text-muted)">Acme Corp</span>
        <span style="font-size:0.85rem;font-weight:500;color:var(--text)">$1,250.00</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:0.85rem;color:var(--text-muted)">Globex Inc</span>
        <span style="font-size:0.85rem;font-weight:500;color:var(--text)">$890.50</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0">
        <span style="font-size:0.85rem;color:var(--text-muted)">Initech</span>
        <span style="font-size:0.85rem;font-weight:500;color:var(--text)">$2,100.00</span>
      </div>
    </div>
  </div>

  <div id="view-receipt" class="view-panel" role="tabpanel">
    <div class="receipt">
      <div class="receipt-header">
        <div class="receipt-merchant">Stellabill</div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">receipt #SB-2024-8842</div>
      </div>
      <div class="receipt-amount">
        <span class="currency">$</span>29.00
      </div>
      <div class="receipt-line">
        <span>Pro Plan — Monthly</span>
        <span class="value">$29.00</span>
      </div>
      <div class="receipt-line">
        <span>Tax (0%)</span>
        <span class="value">$0.00</span>
      </div>
      <div class="receipt-total">
        <span>Total</span>
        <span>$29.00</span>
      </div>
      <div class="receipt-line" style="margin-top:12px">
        <span>Date</span>
        <span class="value">Jul 29, 2026</span>
      </div>
      <div class="receipt-line">
        <span>Card</span>
        <span class="value">•••• 4242</span>
      </div>
      <div class="receipt-status">Paid</div>
    </div>
  </div>
</div>

<script>
(function() {
  function applyTokens(tokens) {
    const root = document.documentElement;
    const map = {
      '--primary': tokens.primaryColor,
      '--secondary': tokens.secondaryColor,
      '--bg': tokens.backgroundColor,
      '--surface': tokens.surfaceColor,
      '--text': tokens.textColor,
      '--text-muted': tokens.mutedTextColor,
      '--accent': tokens.accentColor,
      '--success': tokens.successColor,
      '--danger': tokens.dangerColor,
      '--font': tokens.fontFamily,
      '--font-heading': tokens.headingFontFamily,
      '--radius': tokens.borderRadius,
      '--border': tokens.borderColor,
      '--input-bg': tokens.inputBg,
      '--card-bg': tokens.cardBg,
    };
    for (const [prop, value] of Object.entries(map)) {
      if (value !== undefined && value !== null) {
        root.style.setProperty(prop, value);
      }
    }
  }

  function switchView(view) {
    document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view-tab').forEach(t => t.setAttribute('aria-selected', 'false'));
    const panel = document.getElementById('view-' + view);
    const tab = document.querySelector('[data-view="' + view + '"]');
    if (panel) panel.classList.add('active');
    if (tab) { tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); }
  }

  document.querySelectorAll('.view-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      switchView(this.getAttribute('data-view'));
    });
  });

  window.addEventListener('message', function(event) {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data.type === 'theme-tokens' && data.tokens) {
        applyTokens(data.tokens);
      }
      if (data.type === 'switch-view' && data.view) {
        switchView(data.view);
      }
    } catch(e) {
      /* ignore */
    }
  });

  parent.postMessage({ type: 'preview-ready' }, '*');
})();
</script>
</body>
</html>`;
