---
name: cfo-advisor
description: Financial leadership guidance for fiscal strategy, financial modeling, analysis, and capital management. Includes DCF modeling, Monte Carlo simulation, financial ratio analysis, sensitivity testing, and board financial presentations. USE WHEN analyzing financials, building models, preparing board financial packages, evaluating investments, managing capital allocation, OR user mentions CFO, financial planning, financial analysis, DCF, financial modeling, budget, forecast, capital allocation, fiscal strategy, valuation, investor financials, fundraising financials, OR user wants Monte Carlo simulation, scenario analysis, ratio analysis, cash flow forecasting, or working capital optimization.
license: MIT
metadata:
  version: 1.0.0
  author: CarbeneAI
  category: c-level
  domain: cfo-financial-leadership
  updated: 2026-02-03
  frameworks: dcf-modeling, financial-ratio-analysis, monte-carlo-simulation, sensitivity-analysis, capital-budgeting, working-capital-optimization
---

# CFO Advisor - Financial Leadership Excellence

**Elite financial advisory for strategic decision-making, capital allocation, and fiscal leadership.**

## Keywords

`CFO` `financial modeling` `DCF` `valuation` `financial analysis` `financial ratios` `Monte Carlo` `scenario planning` `capital allocation` `budget` `forecast` `cash flow` `investor relations` `board presentations` `fundraising` `due diligence` `working capital` `WACC` `NPV` `IRR` `financial statements` `P&L` `balance sheet` `cash flow statement` `unit economics` `LTV` `CAC` `burn rate` `runway` `Rule of 40` `ROIC` `ROE` `ROA` `debt-to-equity` `current ratio` `quick ratio` `gross margin` `operating margin` `EBITDA` `sensitivity analysis` `risk management` `hedging` `financial metrics` `KPIs` `financial dashboard` `budget variance` `three-statement model` `merger model` `LBO` `accretion dilution` `fiscal strategy` `capital budgeting` `cost of capital` `terminal value` `free cash flow` `enterprise value` `equity value` `comparable companies` `precedent transactions` `quality of earnings`

## Quick Start

This skill provides comprehensive CFO-level financial advisory services for C-suite executives, founders, investors, and board members. It delivers rigorous financial analysis, sophisticated modeling, and strategic fiscal guidance.

### Common Use Cases

**Financial Modeling:**
```
"Build a DCF model for a SaaS company with $10M ARR growing at 80% YoY"
"Run Monte Carlo simulation on our revenue forecast with these assumptions"
"Create a three-statement model with monthly detail for the next 24 months"
"Model the accretion/dilution of acquiring CompanyX at 8x revenue"
```

**Financial Analysis:**
```
"Analyze these financial statements and provide a comprehensive ratio analysis"
"What do our unit economics tell us? CAC is $450, LTV is $1,200, gross margin 75%"
"Calculate our working capital metrics - what's driving the cash conversion cycle?"
"Evaluate our capital structure - is our leverage ratio optimal?"
```

**Strategic Financial Planning:**
```
"Should we raise Series B now or extend runway? Model both scenarios"
"Analyze capital allocation options: R&D vs. sales expansion vs. acquisition"
"Build a sensitivity analysis on our pricing strategy - impact on revenue and margin"
"What's our optimal cash balance given our burn rate and growth investments?"
```

**Board & Investor Communications:**
```
"Prepare a board financial package for next week's meeting"
"Create an investor financial deck for Series A fundraising"
"Build a QBR financial presentation with variance analysis"
"Develop a use-of-proceeds model for a $20M raise"
```

## Core Capabilities

### 1. Financial Modeling Excellence

#### Discounted Cash Flow (DCF) Analysis

The gold standard for intrinsic valuation. Build comprehensive DCF models that:

**Revenue Projection:**
- Historical growth analysis and trend identification
- Market size and penetration assumptions
- Customer acquisition and retention modeling
- Pricing and volume decomposition
- Multiple scenario planning (base/bull/bear)

**Operating Model:**
- Gross margin evolution (economies of scale, product mix)
- Operating expense modeling (fixed vs. variable)
- Operating leverage and margin expansion
- Working capital requirements (DSO, DIO, DPO)
- Capital expenditure planning

**Free Cash Flow Calculation:**
```
Unlevered FCF = EBIT × (1 - Tax Rate) + D&A - CapEx - Δ Working Capital
Levered FCF = Net Income + D&A - CapEx - Δ Working Capital - Debt Principal Payments
```

**Terminal Value:**
- Gordon Growth Model: TV = FCF(n+1) / (WACC - g)
- Exit Multiple Method: TV = EBITDA(n) × Exit Multiple
- Sensitivity to perpetuity growth rate and exit multiple

**Discount Rate (WACC):**
```
WACC = (E/V × Cost of Equity) + (D/V × Cost of Debt × (1 - Tax Rate))

Cost of Equity (CAPM) = Risk-Free Rate + Beta × Market Risk Premium
Cost of Debt = Interest Rate on Debt × (1 - Tax Rate)
```

**Valuation Output:**
- Enterprise Value = PV(FCF) + PV(Terminal Value)
- Equity Value = Enterprise Value - Net Debt
- Price per Share = Equity Value / Shares Outstanding
- Implied valuation multiples (EV/Revenue, EV/EBITDA, P/E)

**Sensitivity Analysis:**
- One-way sensitivity (revenue growth, margin, WACC, terminal growth)
- Two-way sensitivity tables (revenue vs. margin, WACC vs. terminal value)
- Scenario analysis (best/base/worst case outcomes)

#### Monte Carlo Simulation

Probabilistic modeling for uncertainty and risk quantification:

**Variable Distribution Selection:**
- **Normal Distribution:** For variables that cluster around a mean (e.g., customer churn)
- **Lognormal Distribution:** For variables that can't be negative (e.g., revenue, stock prices)
- **Triangular Distribution:** When min/most likely/max are known (e.g., project timelines)
- **Uniform Distribution:** Equal probability across a range (e.g., random sampling)
- **Custom Distributions:** Empirical data-driven distributions

**Correlation Modeling:**
- Identify correlated variables (e.g., revenue and expenses)
- Build correlation matrices
- Use Cholesky decomposition for multivariate sampling

**Simulation Execution:**
- Run 10,000+ iterations for statistical significance
- Random sampling from distributions
- Calculate outputs for each iteration
- Aggregate results and statistics

**Output Analysis:**
- Probability distributions of outcomes
- Confidence intervals (P10, P50, P90 percentiles)
- Risk metrics (standard deviation, VaR, CVaR)
- Tornado diagrams (rank variables by impact)
- Cumulative probability curves

**Common Applications:**
- Project NPV under uncertainty
- Revenue forecasting with multiple drivers
- Portfolio risk analysis
- Scenario stress testing
- Option valuation (real options)

#### Scenario Planning & Sensitivity

Build decision frameworks under multiple futures:

**Three-Scenario Framework:**

**Base Case:**
- Most likely outcome based on current trends
- Moderate assumptions on growth and margins
- Weighted 50-60% in expected value calculations

**Bull Case:**
- Optimistic scenario with favorable conditions
- Strong market adoption, pricing power, operational efficiency
- Weighted 20-30% in expected value

**Bear Case:**
- Conservative scenario with headwinds
- Market softness, competitive pressure, execution challenges
- Weighted 10-20% in expected value

**Stress Testing:**
- Revenue decline scenarios (-10%, -25%, -50%)
- Margin compression (cost inflation, pricing pressure)
- Liquidity crisis (AR delays, funding gaps)
- Covenant violations and default scenarios

**What-If Analysis:**
- Change one assumption, hold others constant
- Identify breakeven points and critical thresholds
- Assess margin of safety
- War game competitive actions

### 2. Financial Statement Analysis

Comprehensive analysis of P&L, Balance Sheet, and Cash Flow Statement to assess financial health, performance trends, and risk factors.

#### Profitability Ratios

**Gross Margin:**
```
Gross Margin = (Revenue - Cost of Goods Sold) / Revenue
```
- Measures production efficiency and pricing power
- Technology/SaaS: Target >70%, Excellent >80%
- Retail: Target >30-40%, Excellent >50%
- Manufacturing: Target >25-35%, Excellent >40%

**Operating Margin:**
```
Operating Margin = Operating Income (EBIT) / Revenue
```
- Measures operational efficiency before interest and taxes
- SaaS: Target >20%, Excellent >30%
- General: Target >15%, Excellent >25%

**Net Margin:**
```
Net Margin = Net Income / Revenue
```
- Bottom-line profitability after all expenses
- Target >10%, Excellent >20%

**EBITDA Margin:**
```
EBITDA Margin = EBITDA / Revenue
```
- Cash profitability proxy, useful for capital-intensive businesses
- SaaS: Target >25%, Excellent >40%

**Return on Assets (ROA):**
```
ROA = Net Income / Total Assets
```
- Efficiency of asset utilization
- Target >5%, Excellent >10%

**Return on Equity (ROE):**
```
ROE = Net Income / Shareholders' Equity
```
- Return to shareholders on invested capital
- Target >15%, Excellent >20%+

**Return on Invested Capital (ROIC):**
```
ROIC = NOPAT / Invested Capital
NOPAT = Operating Income × (1 - Tax Rate)
Invested Capital = Total Debt + Total Equity - Cash
```
- Core metric for value creation (compare to WACC)
- Target: ROIC > WACC + 5%
- Excellent: ROIC > 15%

#### Liquidity Ratios

**Current Ratio:**
```
Current Ratio = Current Assets / Current Liabilities
```
- Ability to meet short-term obligations
- Target >1.5, Excellent >2.0
- <1.0 = liquidity concern

**Quick Ratio (Acid Test):**
```
Quick Ratio = (Current Assets - Inventory) / Current Liabilities
```
- Conservative liquidity measure (excludes inventory)
- Target >1.0, Excellent >1.5

**Cash Ratio:**
```
Cash Ratio = (Cash + Cash Equivalents) / Current Liabilities
```
- Most conservative liquidity metric
- Target >0.5, Excellent >1.0

**Operating Cash Flow Ratio:**
```
Operating Cash Flow Ratio = Operating Cash Flow / Current Liabilities
```
- Cash generation relative to obligations
- Target >0.4, Excellent >1.0

#### Leverage Ratios

**Debt-to-Equity:**
```
Debt-to-Equity = Total Debt / Total Equity
```
- Financial leverage and solvency
- Target <1.0 (conservative), <2.0 (moderate)
- >3.0 = high leverage risk

**Debt-to-Assets:**
```
Debt-to-Assets = Total Debt / Total Assets
```
- Proportion of assets financed by debt
- Target <0.5, Excellent <0.3

**Interest Coverage:**
```
Interest Coverage = EBIT / Interest Expense
```
- Ability to service debt from operations
- Target >5.0x, Excellent >10.0x
- <2.0x = distress signal

**Debt Service Coverage:**
```
Debt Service Coverage Ratio = Operating Income / Total Debt Service
```
- Ability to cover all debt payments (principal + interest)
- Target >1.25x, Excellent >2.0x
- <1.0x = cannot cover debt payments

**Net Debt to EBITDA:**
```
Net Debt / EBITDA = (Total Debt - Cash) / EBITDA
```
- Leverage relative to cash generation
- Target <3.0x, Excellent <2.0x
- >5.0x = overleveraged

#### Efficiency Ratios

**Asset Turnover:**
```
Asset Turnover = Revenue / Average Total Assets
```
- Revenue generation per dollar of assets
- Higher is better; varies by industry

**Inventory Turnover:**
```
Inventory Turnover = Cost of Goods Sold / Average Inventory
```
- How quickly inventory converts to sales
- Retail: Target >6x, Excellent >10x
- Manufacturing: Target >4x, Excellent >8x

**Days Sales Outstanding (DSO):**
```
DSO = (Accounts Receivable / Revenue) × 365
```
- Average collection period in days
- SaaS: Target <45 days, Excellent <30 days
- B2B: Target <60 days, Excellent <45 days

**Days Inventory Outstanding (DIO):**
```
DIO = (Inventory / Cost of Goods Sold) × 365
```
- Days inventory sits before sale
- Lower is better; varies by industry

**Days Payable Outstanding (DPO):**
```
DPO = (Accounts Payable / Cost of Goods Sold) × 365
```
- Days to pay suppliers
- Longer is better (cash preservation), but maintain supplier relationships

**Cash Conversion Cycle (CCC):**
```
CCC = DSO + DIO - DPO
```
- Days to convert investments into cash
- Target <60 days, Excellent <30 days
- Negative CCC = getting paid before paying suppliers (ideal)

#### Valuation Ratios

**Price-to-Earnings (P/E):**
```
P/E Ratio = Market Price per Share / Earnings per Share
```
- Market valuation relative to profitability
- Tech: 20-40x, High-growth: 40-100x+

**Price-to-Book (P/B):**
```
P/B Ratio = Market Price per Share / Book Value per Share
```
- Market value relative to accounting value
- >1.0 = market values company above book value

**Price-to-Sales (P/S):**
```
P/S Ratio = Market Capitalization / Revenue
```
- Useful for unprofitable high-growth companies
- SaaS: 5-15x, High-growth SaaS: 15-30x+

**EV/Revenue:**
```
EV/Revenue = Enterprise Value / Revenue
```
- Enterprise value relative to sales
- Removes capital structure differences

**EV/EBITDA:**
```
EV/EBITDA = Enterprise Value / EBITDA
```
- Most common valuation multiple
- Target range: 8-15x (mature), 15-30x+ (high-growth)

**PEG Ratio:**
```
PEG Ratio = (P/E Ratio) / Earnings Growth Rate
```
- P/E adjusted for growth
- <1.0 = potentially undervalued
- >2.0 = potentially overvalued

#### Per-Share Metrics

**Earnings Per Share (EPS):**
```
EPS = (Net Income - Preferred Dividends) / Weighted Average Shares Outstanding
```

**Book Value Per Share:**
```
Book Value Per Share = (Total Equity - Preferred Equity) / Shares Outstanding
```

**Free Cash Flow Per Share:**
```
FCF Per Share = Free Cash Flow / Shares Outstanding
```

### 3. SaaS & Tech Company Specific Metrics

**Rule of 40:**
```
Rule of 40 = Revenue Growth Rate (%) + EBITDA Margin (%)
```
- Target ≥40% for healthy SaaS companies
- <40% = need to improve growth or profitability
- >40% = strong efficiency

**Magic Number:**
```
Magic Number = Net New ARR (Quarter) / Sales & Marketing Spend (Prior Quarter)
```
- Sales efficiency metric
- <0.5 = poor efficiency
- 0.5-0.75 = acceptable
- >0.75 = good
- >1.0 = excellent

**CAC Payback Period:**
```
CAC Payback = Customer Acquisition Cost / (Monthly Recurring Revenue × Gross Margin %)
```
- Months to recover customer acquisition cost
- Target <12 months, Excellent <6 months
- >18 months = concerning

**LTV/CAC Ratio:**
```
LTV/CAC = Customer Lifetime Value / Customer Acquisition Cost

LTV = (Average Revenue per Customer / Month) × Gross Margin % / Monthly Churn Rate
```
- Long-term profitability of customer acquisition
- Target >3.0x, Excellent >5.0x
- <1.0x = losing money on every customer

**Net Dollar Retention (NDR):**
```
NDR = ((Starting ARR + Expansion - Churn - Contraction) / Starting ARR) × 100
```
- Revenue retention including expansion
- Target >100%, Excellent >120%
- Best-in-class: >130%

**Annual Recurring Revenue (ARR):**
```
ARR = Monthly Recurring Revenue (MRR) × 12
```

**Burn Multiple:**
```
Burn Multiple = Net Burn / Net New ARR
```
- Capital efficiency for growth
- Target <1.5x, Excellent <1.0x
- >2.0x = inefficient

### 4. Capital Allocation Strategy

Strategic deployment of capital to maximize shareholder value.

#### Capital Budgeting Framework

**Net Present Value (NPV):**
```
NPV = Σ [Cash Flow(t) / (1 + Discount Rate)^t] - Initial Investment
```
- Accept if NPV > 0
- Rank projects by NPV if capital constrained

**Internal Rate of Return (IRR):**
```
IRR = Discount rate where NPV = 0
```
- Accept if IRR > Hurdle Rate (typically WACC)
- Caution: Multiple IRRs possible with non-conventional cash flows

**Payback Period:**
```
Payback Period = Years to recover initial investment
```
- Simple metric, ignores time value
- Useful for liquidity-constrained situations

**Discounted Payback Period:**
```
Discounted Payback = Years to recover investment using discounted cash flows
```
- Addresses time value limitation of simple payback

**Profitability Index (PI):**
```
Profitability Index = PV(Future Cash Flows) / Initial Investment
```
- Accept if PI > 1.0
- Useful for ranking projects when capital rationed

#### Portfolio Optimization

**Capital Allocation Across Business Units:**
- Growth investments (new products, markets, customers)
- Maintenance investments (existing operations)
- Strategic investments (M&A, partnerships)
- Return of capital (dividends, buybacks)

**Decision Framework:**
1. Calculate ROIC for each business unit/project
2. Rank by ROIC - WACC spread
3. Allocate to highest-returning projects until capital exhausted
4. Consider strategic value beyond pure financial return

**Build vs. Buy Analysis:**
- Build: NPV of internal development, time to market, capability gaps
- Buy: Acquisition cost, integration costs, execution risk
- Partner: Revenue share economics, strategic control trade-offs

#### Economic Value Added (EVA)

```
EVA = NOPAT - (Invested Capital × WACC)
EVA = Invested Capital × (ROIC - WACC)
```
- Absolute dollar value creation above cost of capital
- Positive EVA = creating value
- Negative EVA = destroying value

### 5. Risk Management & Hedging

Identify, quantify, and mitigate financial risks.

#### Financial Risk Categories

**Market Risk:**
- **Interest Rate Risk:** Exposure to rate changes (debt financing, investments)
- **Foreign Exchange Risk:** Currency fluctuation impact on revenue/costs
- **Commodity Risk:** Input cost volatility (oil, metals, agricultural products)
- **Equity Risk:** Investment portfolio volatility

**Credit Risk:**
- **Counterparty Risk:** Customer/supplier default risk
- **Concentration Risk:** Revenue/supplier concentration
- **Settlement Risk:** Payment system failures

**Liquidity Risk:**
- **Funding Liquidity:** Ability to meet cash obligations
- **Asset Liquidity:** Ability to convert assets to cash quickly

**Operational Risk:**
- **Process Risk:** Internal control failures, errors
- **Systems Risk:** Technology failures, cybersecurity
- **People Risk:** Key person dependencies, fraud

#### Risk Mitigation Strategies

**Hedging Instruments:**
- **Forwards:** Lock in future price/rate (customized, OTC)
- **Futures:** Standardized exchange-traded forwards
- **Options:** Right but not obligation (calls, puts)
- **Swaps:** Exchange cash flows (interest rate swaps, currency swaps)

**Natural Hedges:**
- Match revenue and cost currencies (operational hedge)
- Diversify customer base geographically
- Long-term supplier contracts to lock costs

**Insurance & Risk Transfer:**
- Property & casualty insurance
- Business interruption insurance
- Directors & officers (D&O) liability
- Cyber liability insurance
- Key person life insurance

#### Risk Metrics

**Value at Risk (VaR):**
- Maximum expected loss over time period at confidence level
- "95% VaR of $1M" = 95% confident losses won't exceed $1M

**Conditional Value at Risk (CVaR):**
- Expected loss given VaR is exceeded
- Tail risk measure

**Sharpe Ratio:**
```
Sharpe Ratio = (Return - Risk-Free Rate) / Standard Deviation
```
- Risk-adjusted return metric
- Higher is better (more return per unit of risk)

**Sortino Ratio:**
```
Sortino Ratio = (Return - Risk-Free Rate) / Downside Deviation
```
- Like Sharpe but only penalizes downside volatility

### 6. Board Financial Communications

#### Monthly Board Financial Package

**Executive Summary (1 page):**
- Financial highlights (revenue, burn, runway)
- Key metrics vs. targets
- Major variances explained
- Critical issues and decisions needed

**Income Statement:**
- Actual vs. Budget with variance %
- Prior month comparison
- Year-to-date performance
- Key driver commentary

**Cash Flow Statement:**
- Operating, investing, financing activities
- Cash runway calculation (months)
- 13-week cash flow forecast
- Significant cash movements explained

**Balance Sheet:**
- Assets, liabilities, equity snapshot
- Working capital trends
- Debt covenants status
- Off-balance sheet commitments

**Key Metrics Dashboard:**
- Unit economics (CAC, LTV, payback, burn multiple)
- Growth metrics (ARR, MRR, bookings, pipeline)
- Customer metrics (NDR, churn, cohort retention)
- Operational efficiency (Rule of 40, Magic Number)

**Variance Analysis:**
- Revenue variance (volume vs. price, customer mix)
- Cost variance (fixed vs. variable, timing)
- Root cause identification
- Corrective actions

#### Quarterly Business Review (QBR)

**Strategic Financial Review:**
- Quarterly performance vs. annual plan
- Year-over-year comparisons
- Segment/product profitability deep dive
- Market share and competitive positioning

**Forward-Looking Forecast:**
- Updated full-year forecast
- Scenario planning (upside/downside cases)
- Key assumptions and sensitivities
- Investment priorities and resource allocation

**Risk & Mitigation:**
- Top financial risks and likelihood/impact
- Risk mitigation strategies and status
- Covenant compliance and headroom
- Contingency planning

#### Annual Strategic Planning

**Long-Range Financial Plan (3-5 years):**
- Revenue growth projections by segment
- Profitability roadmap (path to positive EBITDA/FCF)
- Capital requirements and funding strategy
- Strategic milestones and KPIs

**Capital Allocation Strategy:**
- Organic growth investments
- M&A criteria and capacity
- R&D and product roadmap funding
- Return of capital policy

### 7. Investor Relations & Fundraising

#### Fundraising Financial Materials

**Historical Financial Performance:**
- 3+ years of P&L, Balance Sheet, Cash Flow
- Monthly detail for last 12-24 months
- Key metrics trends (ARR, gross margin, burn)
- Cohort analysis showing retention improvements

**Financial Projections:**
- Monthly detail for next 12-24 months
- Annual projections for 3-5 years
- Revenue build-up by segment/product
- Headcount plan by department
- Margin expansion roadmap

**Unit Economics:**
- CAC by channel with trend analysis
- LTV by cohort with retention curves
- Contribution margin by product
- Payback period evolution
- Path to positive unit economics (if not there yet)

**Use of Proceeds:**
- Detailed allocation (sales, R&D, G&A, working capital)
- Milestones funded by raise
- Runway extension (months)
- Key hires and timing

**Capitalization Table:**
- Current ownership breakdown
- Pro forma post-raise (including option pool)
- Dilution analysis by investor group
- Liquidation preferences and seniority
- Fully diluted shares outstanding

**Comparable Company Analysis:**
- Public company comps (trading multiples)
- Private company comps (funding rounds, valuations)
- Positioning vs. peers (growth, margins, efficiency)

#### Due Diligence Preparation

**Quality of Earnings (QoE):**
- Revenue recognition policies (ASC 606 compliance)
- Non-recurring revenue and expenses
- Adjusted EBITDA reconciliation
- Unusual or one-time items
- Pro forma adjustments justification

**Revenue Analysis:**
- Customer contracts review (terms, renewals, cancellation)
- Revenue concentration (top 10 customers)
- Deferred revenue and backlog
- Churn analysis and reasons
- Channel mix and partnerships

**Cost Structure:**
- COGS breakdown and gross margin drivers
- Operating expense categorization (people vs. non-people)
- Capitalized costs (software development, sales commissions)
- Related party transactions
- Contingent liabilities

**Working Capital:**
- DSO, DIO, DPO trends
- AR aging and collectibility
- Inventory obsolescence risk
- AP aging and vendor terms
- Accrued liabilities and reserves

**Contracts & Commitments:**
- Debt agreements and covenants
- Operating leases and real estate
- Customer contracts (multi-year deals, minimums)
- Vendor commitments
- Legal contingencies and litigation

### 8. Cash Flow Management

#### 13-Week Cash Flow Forecast

Weekly cash forecast for next quarter to manage short-term liquidity:

**Cash Receipts:**
- Customer collections (by customer for large accounts)
- AR aging-based timing
- New bookings expected
- Other income (interest, asset sales)

**Cash Disbursements:**
- Payroll (bi-weekly or semi-monthly)
- Vendor payments (by vendor, payment terms)
- Rent and facilities
- Debt service (principal and interest)
- CapEx and one-time expenses

**Net Cash Position:**
- Beginning cash balance
- Weekly net cash flow
- Ending cash balance
- Minimum cash requirement
- Covenant compliance check

**Scenarios:**
- Base case (expected)
- Downside case (15-20% revenue miss, AR delays)
- Mitigation actions if cash drops below threshold

#### Working Capital Optimization

**Cash Conversion Cycle Improvement:**
- Reduce DSO: Accelerate invoicing, improve collections, offer early-pay discounts
- Reduce DIO: JIT inventory, demand forecasting, SKU rationalization
- Increase DPO: Negotiate extended terms, optimize payment timing

**Accounts Receivable Management:**
- Credit policy and approval process
- Invoice promptly (same day as delivery/milestone)
- Automated payment reminders
- Collections prioritization (high-value, overdue)
- Early payment discounts (1% 10 net 30)

**Inventory Management:**
- Economic Order Quantity (EOQ) optimization
- Safety stock levels by SKU
- Obsolescence monitoring and write-downs
- Consignment inventory agreements

**Accounts Payable Optimization:**
- Take full payment terms (don't pay early unless discount)
- Centralize AP for better cash visibility
- Supplier negotiations (extended terms, volume discounts)
- AP automation to avoid late fees

### 9. M&A Financial Due Diligence

#### Buy-Side Diligence

**Valuation Analysis:**
- DCF with synergy assumptions
- Comparable company multiples
- Precedent transaction multiples
- Standalone vs. combined valuation
- Accretion/dilution analysis

**Synergy Identification:**
- Revenue synergies (cross-sell, pricing, new markets)
- Cost synergies (headcount, systems, facilities)
- Timing and probability-weighting
- One-time costs to achieve synergies

**Integration Planning:**
- Day 1 readiness (systems, people, customers)
- 100-day plan (quick wins, risk mitigation)
- Integration costs (severance, system migration, rebranding)
- Retention packages for key employees

**Deal Structure:**
- Cash vs. stock consideration
- Earnouts and contingent payments
- Escrows and indemnification
- Financing sources (cash on hand, debt, equity)

#### Sell-Side Preparation

**Company Positioning:**
- Investment thesis and strategic value
- Growth story and market opportunity
- Competitive differentiation
- Management team strength

**Financial Narratives:**
- Historical performance with context
- Adjusted EBITDA (normalize for one-time items)
- Margin expansion roadmap
- Pro forma synergies for buyer

**Data Room Preparation:**
- Organized financial documents (3+ years)
- Customer contracts and pipeline
- Product roadmap and R&D
- Legal and IP documentation
- HR and employee census

**Process Management:**
- NDA and buyer qualification
- Management presentation and Q&A
- Diligence response coordination
- Negotiation strategy and walkaway price

## CFO Weekly/Quarterly Cadence

### Weekly CFO Priorities (2 hours)

**Monday Morning (30 min):**
- Review cash position and forecast
- Check major receipts/disbursements
- Update runway calculation
- Identify any liquidity issues

**Mid-week (45 min):**
- Review weekly bookings and pipeline
- Check burn rate vs. plan
- Review key metric dashboard
- FP&A team sync on forecast

**Friday (45 min):**
- Weekly team update (accounting, FP&A, treasury)
- Next week's major cash events
- Month-end close preparation (if applicable)
- Escalate any issues to CEO/board

### Monthly Cadence (15-20 hours)

**Week 1: Financial Close (Days 1-7)**
- Close accounting period (Days 1-4)
- Preliminary results review (Day 5)
- Variance analysis preparation (Days 6-7)
- Cash flow reconciliation

**Week 2: Reporting & Analysis (Days 8-14)**
- Board package preparation (Days 8-10)
- Finalize variance explanations
- Department budget reviews
- Investor/lender reporting

**Week 3: Planning & Strategy (Days 15-21)**
- Rolling forecast update
- Scenario planning adjustments
- Strategic initiative financial reviews
- Team 1-on-1s and development

**Week 4: Operations & Execution (Days 22-30)**
- AR collections push
- AP optimization
- Next month preparation
- Special projects and ad hoc analysis

### Quarterly Cadence (40-60 hours)

**Pre-Quarter End (Weeks -2 to -1):**
- Forecast scrub for accuracy
- Earnings guidance preparation (if public)
- Board QBR material planning
- Audit coordination (if audited)

**Quarter Close (Week 1):**
- Financial statement close
- Audit fieldwork support
- Preliminary results analysis
- Management discussion preparation

**Quarter Review (Week 2-3):**
- QBR presentation to board
- Investor earnings call (if public)
- Department business reviews
- Full-year forecast refresh

**Quarter Planning (Week 4+):**
- Next quarter budget finalization
- Annual plan progress check
- Capital allocation review
- Risk assessment update
- Compensation and headcount planning

## Tools & Resources

### Financial Models (Build/Deliver)

1. **DCF Valuation Model**
   - Revenue build-up with drivers
   - Operating model with margin assumptions
   - FCF calculation and WACC
   - Terminal value and sensitivity tables

2. **Three-Statement Model**
   - Integrated P&L, Balance Sheet, Cash Flow
   - Monthly detail for 24+ months
   - Scenario toggle (base/bull/bear)
   - Key metrics dashboard

3. **LBO (Leveraged Buyout) Model**
   - Sources & uses of funds
   - Debt schedule with amortization
   - Returns analysis (IRR, MOIC)
   - Exit scenarios and sensitivity

4. **Merger Model**
   - Purchase price allocation
   - Accretion/dilution analysis
   - Pro forma financials
   - Synergy realization schedule

5. **Unit Economics Model**
   - CAC by channel
   - LTV by cohort
   - Payback and LTV/CAC
   - Contribution margin waterfall

6. **Budget Model**
   - Annual budget with monthly phasing
   - Department-level detail
   - Headcount planning
   - Variance tracking

7. **Monte Carlo Simulation**
   - Variable distributions setup
   - Correlation matrix
   - Output probability distributions
   - Risk metrics (VaR, CVaR)

### Dashboards & Reports

1. **Executive Financial Dashboard**
   - Revenue, burn, runway (big numbers)
   - Key metrics vs. targets
   - Traffic light indicators
   - Month/quarter/year trends

2. **Board Financial Package**
   - Executive summary
   - Financial statements with variance
   - Metrics dashboard
   - Forward forecast

3. **Investor Update**
   - KPI scorecard
   - Milestone achievement
   - Use of proceeds status
   - Fundraising update (if applicable)

4. **Cash Flow Forecast (13-week)**
   - Weekly receipts and disbursements
   - Rolling cash balance
   - Covenant compliance
   - Scenario planning

5. **Ratio Analysis Scorecard**
   - Profitability, liquidity, leverage, efficiency ratios
   - Industry benchmark comparison
   - Trend analysis (current vs. prior periods)
   - Rating system (Excellent/Good/Acceptable/Poor)

### Reference Materials

See `reference/` directory for detailed guides:

- **FinancialModelingFramework.md** - Comprehensive DCF methodology, Monte Carlo setup, sensitivity analysis techniques
- **FinancialRatioAnalysis.md** - All ratio formulas, industry benchmarks by sector, interpretation guidelines, rating system

## Success Indicators

### Financial Health (What Good Looks Like)

**SaaS Company:**
- Rule of 40 >40%
- Gross margin >75%
- CAC payback <12 months
- LTV/CAC >3.0x
- NDR >110%
- Burn multiple <1.5x
- Runway >18 months

**Mature Company:**
- Revenue growth >10% YoY
- Operating margin >20%
- ROIC >15% and >WACC + 5%
- Current ratio >2.0
- Debt/EBITDA <3.0x
- Interest coverage >5.0x
- Positive FCF generation

**Startup (Pre-profitability):**
- Revenue growth >100% YoY (early) or >50% YoY (growth)
- Gross margin >60% and improving
- Burn rate predictable and planned
- Runway >12 months (ideally 18+)
- Unit economics improving (LTV/CAC trending toward 3x)
- Clear path to profitability

### Capital Efficiency

- NPV positive on major investments
- ROIC >WACC on all business units
- EVA positive and growing
- Working capital as % of revenue declining
- Cash conversion cycle <60 days

### Risk Management

- No covenant violations
- Diversified customer base (<20% concentration)
- Adequate liquidity (current ratio >1.5)
- Hedged material exposures (FX, interest rate)
- Insurance coverage appropriate to risk

## Red Flags (What to Watch)

### Income Statement Warnings

- Revenue growing but gross margin declining (pricing pressure, mix shift)
- Operating expenses growing faster than revenue (inefficiency)
- Large and frequent "non-recurring" items (earnings manipulation)
- Revenue recognition changes without clear explanation
- Significant related party revenue

### Balance Sheet Warnings

- DSO expanding rapidly (collection issues, revenue quality)
- Inventory piling up (demand issues, obsolescence)
- Goodwill/intangibles >50% of assets (acquisition-heavy, impairment risk)
- Declining cash despite "profitable" P&L (earnings quality issue)
- Off-balance sheet liabilities (leases, guarantees, contingencies)

### Cash Flow Warnings

- Operating cash flow <Net Income consistently (working capital drain)
- Negative FCF despite positive EBITDA (heavy CapEx, working capital)
- Financing activities as primary cash source (unsustainable)
- Burn rate accelerating without revenue growth
- Covenant violations or waivers

### Strategic & Operational Warnings

- Customer concentration increasing (>20% from top customer)
- Customer churn accelerating (retention issues)
- CAC increasing and/or payback extending (market saturation)
- Key personnel turnover (especially finance, sales, product)
- Delayed financial reporting or audit issues
- Frequent restatements

### Market & Competitive Warnings

- Market share declining
- Pricing pressure from competitors
- Gross margin compression in mature products
- New entrants with better economics
- Customer switching costs declining

## Example Outputs

### Example 1: Quick Financial Health Check

**Input:** "Analyze this company's financial health. Revenue $50M, growing 30% YoY. Gross margin 65%. Operating expenses $40M. EBITDA $2.5M. Cash $8M. AR $6M. Current liabilities $4M. Debt $10M."

**Output:**
```
FINANCIAL HEALTH ASSESSMENT

Profitability:
- Gross Margin: 65% (Good for SaaS/tech)
- EBITDA Margin: 5% ($2.5M / $50M) - Low but positive
- Implied OpEx as % Revenue: 80% - High burn

Liquidity:
- Current Ratio: 3.5x ($14M / $4M) - Strong
- Cash: $8M = 2.4 months of OpEx - Moderate runway

Leverage:
- Debt: $10M = 4.0x EBITDA - High leverage
- Net Debt: $2M ($10M - $8M) = 0.8x EBITDA - Acceptable

Efficiency:
- DSO: 44 days ($6M / $50M × 365) - Acceptable

Growth:
- Revenue Growth: 30% YoY - Strong

OVERALL ASSESSMENT:
- Strengths: Strong growth, solid gross margin, good liquidity
- Concerns: High OpEx ratio (80%), high debt/EBITDA (4x)
- Priority: Path to profitability - need to scale OpEx slower than revenue
- Target: Get EBITDA margin to 15%+ (reduce OpEx to 50% of revenue)

RECOMMENDATION: Monitor cash burn closely. If growth slows, liquidity becomes an issue. Consider refinancing debt if possible (4x is high). Focus on operational leverage - grow revenue faster than OpEx.
```

### Example 2: DCF Valuation Request

**Input:** "Value this SaaS company using DCF. Current ARR $20M, growing 60% YoY for next 3 years then 40%/30%/25% thereafter. Gross margin 75%, operating margin currently -10% but improving to +25% by year 5. Tax rate 25%. WACC 12%. Terminal growth 3%."

**Output:**
```
DCF VALUATION MODEL

Revenue Projection:
Year 1: $32.0M (60% growth)
Year 2: $51.2M (60% growth)
Year 3: $81.9M (60% growth)
Year 4: $114.7M (40% growth)
Year 5: $149.1M (30% growth)
Year 6: $186.3M (25% growth)

Operating Margin Progression:
Year 1: -10% → EBIT: -$3.2M
Year 2: 0% → EBIT: $0
Year 3: 10% → EBIT: $8.2M
Year 4: 18% → EBIT: $20.6M
Year 5: 25% → EBIT: $37.3M
Year 6: 25% → EBIT: $46.6M

Free Cash Flow (simplified, assuming CapEx ~5% revenue, no working capital change):
Year 1: -$3.6M
Year 2: -$0.6M
Year 3: $5.1M
Year 4: $14.8M
Year 5: $26.5M
Year 6: $33.6M

PV of Cash Flows (WACC 12%):
Year 1: -$3.2M
Year 2: -$0.5M
Year 3: $3.6M
Year 4: $9.4M
Year 5: $15.0M
Sum: $24.3M

Terminal Value:
Year 6 FCF × (1 + 3%) / (12% - 3%) = $33.6M × 1.03 / 0.09 = $384.5M
PV of Terminal Value: $384.5M / 1.12^5 = $218.2M

Enterprise Value: $24.3M + $218.2M = $242.5M

Implied Multiples:
- EV/Revenue (current): 12.1x
- EV/Revenue (Year 1): 7.6x
- EV/EBITDA (Year 5): 6.5x

SENSITIVITY ANALYSIS (Terminal Growth vs. WACC):

            WACC 10%   WACC 12%   WACC 14%
Term 2%      $301M      $218M      $163M
Term 3%      $337M      $243M      $180M
Term 4%      $382M      $271M      $200M

VALUATION RANGE: $180M - $337M
BASE CASE: $243M at 12% WACC, 3% terminal growth
```

## When to Use This Skill

Invoke this skill when you need:

- **Financial Modeling:** DCF, Monte Carlo, scenario planning, sensitivity analysis
- **Financial Analysis:** Ratio analysis, statement analysis, trend analysis, benchmarking
- **Capital Decisions:** NPV, IRR, capital allocation, build vs. buy, M&A evaluation
- **Board/Investor Communications:** Board packages, QBRs, fundraising materials, investor updates
- **Strategic Planning:** Long-range plans, budget development, forecast updates
- **Cash Management:** Cash flow forecasting, working capital optimization, liquidity analysis
- **Risk Management:** Risk identification, hedging strategies, scenario stress testing
- **Due Diligence:** Buy-side or sell-side M&A financial analysis
- **Performance Evaluation:** Unit economics, cohort analysis, customer profitability
- **Valuation:** Company valuation, fairness opinions, comparable analysis

## Related Skills

- **ceo-advisor**: Strategic planning, board governance, investor relations strategy
- **cto-advisor**: Technology investment evaluation, R&D budgeting, tech debt financial impact
- **Research**: Market sizing, competitive intelligence, industry benchmarking
- **xlsx**: Financial model implementation in spreadsheets

---

**CarbeneAI - Elite C-Suite Advisory**
*Combining biblical wisdom with modern financial excellence*
