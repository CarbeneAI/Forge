# Financial Ratio Analysis - CFO Advisor Reference

**Comprehensive guide to financial ratios with formulas, industry benchmarks, interpretation guidelines, and rating systems.**

---

## Table of Contents

1. [Profitability Ratios](#profitability-ratios)
2. [Liquidity Ratios](#liquidity-ratios)
3. [Leverage Ratios](#leverage-ratios)
4. [Efficiency Ratios](#efficiency-ratios)
5. [Valuation Ratios](#valuation-ratios)
6. [Per-Share Metrics](#per-share-metrics)
7. [SaaS & Tech Specific Metrics](#saas--tech-specific-metrics)
8. [Industry Benchmarks](#industry-benchmarks)
9. [Ratio Analysis Framework](#ratio-analysis-framework)
10. [Rating System](#rating-system)

---

## Profitability Ratios

Measure a company's ability to generate profit relative to revenue, assets, or equity.

### Gross Margin

**Formula:**
```
Gross Margin = (Revenue - Cost of Goods Sold) / Revenue
```

**What It Measures:**
- Production/delivery efficiency
- Pricing power
- Product mix economics
- Scalability potential

**Interpretation:**
- **Higher is better** - more profit available to cover operating expenses
- Indicates competitive advantage if consistently high
- Margin expansion signals improving efficiency or pricing power
- Margin compression signals competitive pressure or cost inflation

**Rating System:**

| Industry | Excellent | Good | Acceptable | Poor |
|----------|-----------|------|------------|------|
| **SaaS/Software** | >80% | 70-80% | 60-70% | <60% |
| **Technology Hardware** | >50% | 40-50% | 30-40% | <30% |
| **E-commerce** | >50% | 40-50% | 30-40% | <30% |
| **Retail** | >40% | 30-40% | 20-30% | <20% |
| **Manufacturing** | >40% | 30-40% | 20-30% | <20% |
| **Food & Beverage** | >35% | 25-35% | 15-25% | <15% |

### Operating Margin

**Formula:**
```
Operating Margin = Operating Income (EBIT) / Revenue
OR
Operating Margin = (Revenue - COGS - Operating Expenses) / Revenue
```

**What It Measures:**
- Operational efficiency before interest and taxes
- Management's ability to control costs
- Operating leverage (scalability)

**Interpretation:**
- Shows profitability from core operations
- Higher margin = better cost control
- Compare to gross margin to see OpEx efficiency
- Industry-specific (tech higher than retail)

**Rating System:**

| Industry | Excellent | Good | Acceptable | Poor |
|----------|-----------|------|------------|------|
| **SaaS/Software** | >30% | 20-30% | 10-20% | <10% |
| **Technology** | >25% | 15-25% | 5-15% | <5% |
| **Healthcare** | >20% | 10-20% | 5-10% | <5% |
| **Retail** | >10% | 5-10% | 2-5% | <2% |
| **Manufacturing** | >15% | 10-15% | 5-10% | <5% |
| **Financial Services** | >25% | 15-25% | 10-15% | <10% |

### Net Margin

**Formula:**
```
Net Margin = Net Income / Revenue
```

**What It Measures:**
- Bottom-line profitability after all expenses
- Overall business efficiency
- Impact of financing and tax strategies

**Interpretation:**
- Final measure of profitability
- Affected by capital structure (debt/equity)
- Tax efficiency matters
- Lower than operating margin due to interest/taxes

**Rating System:**

| Industry | Excellent | Good | Acceptable | Poor |
|----------|-----------|------|------------|------|
| **SaaS/Software** | >20% | 10-20% | 5-10% | <5% |
| **Technology** | >15% | 10-15% | 5-10% | <5% |
| **Healthcare** | >15% | 10-15% | 5-10% | <5% |
| **Retail** | >8% | 5-8% | 2-5% | <2% |
| **Manufacturing** | >10% | 7-10% | 3-7% | <3% |
| **Financial Services** | >20% | 15-20% | 10-15% | <10% |

### EBITDA Margin

**Formula:**
```
EBITDA Margin = EBITDA / Revenue
EBITDA = EBIT + Depreciation + Amortization
```

**What It Measures:**
- Cash profitability proxy
- Operating performance before capital structure
- Useful for capital-intensive businesses

**Interpretation:**
- Ignores CapEx differences between companies
- Useful for M&A comparisons (removes capital structure)
- Common in leveraged finance (debt capacity)
- Can be misleading if CapEx is high

**Rating System:**

| Industry | Excellent | Good | Acceptable | Poor |
|----------|-----------|------|------------|------|
| **SaaS/Software** | >40% | 30-40% | 20-30% | <20% |
| **Technology** | >30% | 20-30% | 10-20% | <10% |
| **Telecom** | >35% | 25-35% | 15-25% | <15% |
| **Retail** | >12% | 8-12% | 4-8% | <4% |
| **Manufacturing** | >20% | 15-20% | 10-15% | <10% |
| **Healthcare** | >25% | 18-25% | 10-18% | <10% |

### Return on Assets (ROA)

**Formula:**
```
ROA = Net Income / Total Assets
OR
ROA = Net Income / Average Total Assets
```

**What It Measures:**
- Efficiency of asset utilization
- Profitability per dollar of assets
- Management effectiveness

**Interpretation:**
- Higher is better (more profit from same assets)
- Asset-light businesses (software) naturally higher
- Asset-heavy businesses (manufacturing) naturally lower
- Compare within industry only

**Rating System:**

| Industry | Excellent | Good | Acceptable | Poor |
|----------|-----------|------|------------|------|
| **SaaS/Software** | >15% | 10-15% | 5-10% | <5% |
| **Technology** | >12% | 8-12% | 4-8% | <4% |
| **Retail** | >8% | 5-8% | 3-5% | <3% |
| **Manufacturing** | >8% | 5-8% | 3-5% | <3% |
| **Financial Services** | >1.5% | 1.0-1.5% | 0.5-1.0% | <0.5% |
| **Utilities** | >3% | 2-3% | 1-2% | <1% |

### Return on Equity (ROE)

**Formula:**
```
ROE = Net Income / Shareholders' Equity
OR
ROE = Net Income / Average Shareholders' Equity
```

**What It Measures:**
- Return to shareholders on invested capital
- Profitability relative to equity base
- Impact of leverage (higher debt → higher ROE if profitable)

**Interpretation:**
- Higher is better for shareholders
- Can be inflated by high leverage (risky)
- Use DuPont analysis to decompose (margin × turnover × leverage)
- Compare to cost of equity (should exceed it)

**Rating System:**

| Industry | Excellent | Good | Acceptable | Poor |
|----------|-----------|------|------------|------|
| **SaaS/Software** | >25% | 18-25% | 12-18% | <12% |
| **Technology** | >20% | 15-20% | 10-15% | <10% |
| **Retail** | >15% | 12-15% | 8-12% | <8% |
| **Manufacturing** | >18% | 13-18% | 8-13% | <8% |
| **Financial Services** | >12% | 10-12% | 8-10% | <8% |
| **All Industries** | >20% | 15-20% | 10-15% | <10% |

### Return on Invested Capital (ROIC)

**Formula:**
```
ROIC = NOPAT / Invested Capital

NOPAT = Operating Income × (1 - Tax Rate)
Invested Capital = Total Debt + Total Equity - Cash
OR
Invested Capital = Total Assets - Non-Interest-Bearing Current Liabilities
```

**What It Measures:**
- Return on all capital (debt + equity)
- True economic profitability
- Value creation (compare to WACC)

**Interpretation:**
- **Most important profitability metric for value creation**
- ROIC > WACC = creating value
- ROIC < WACC = destroying value
- Target: ROIC > WACC + 5% for sustainable value creation

**Rating System:**

| ROIC vs. WACC | Rating | Value Creation |
|---------------|--------|----------------|
| ROIC > WACC + 10% | Excellent | Strong value creation |
| ROIC > WACC + 5% | Good | Solid value creation |
| ROIC > WACC + 0% | Acceptable | Marginal value creation |
| ROIC < WACC | Poor | Value destruction |

**Absolute ROIC Benchmarks:**

| Rating | ROIC |
|--------|------|
| Excellent | >20% |
| Good | 15-20% |
| Acceptable | 10-15% |
| Poor | <10% |

---

## Liquidity Ratios

Measure a company's ability to meet short-term obligations.

### Current Ratio

**Formula:**
```
Current Ratio = Current Assets / Current Liabilities
```

**What It Measures:**
- Short-term liquidity
- Ability to pay obligations within 12 months
- Financial cushion

**Interpretation:**
- Ratio > 1.0 = can cover short-term liabilities
- Ratio < 1.0 = liquidity concern
- Too high (>3.0) = inefficient use of capital
- Industry-specific (retail lower, manufacturing higher)

**Rating System:**

| Rating | Current Ratio | Interpretation |
|--------|---------------|----------------|
| Excellent | >2.5 | Strong liquidity cushion |
| Good | 2.0-2.5 | Healthy liquidity |
| Acceptable | 1.5-2.0 | Adequate liquidity |
| Concerning | 1.0-1.5 | Tight liquidity |
| Poor | <1.0 | Liquidity crisis risk |

### Quick Ratio (Acid Test)

**Formula:**
```
Quick Ratio = (Current Assets - Inventory) / Current Liabilities
OR
Quick Ratio = (Cash + Marketable Securities + Accounts Receivable) / Current Liabilities
```

**What It Measures:**
- Conservative liquidity (excludes inventory)
- Immediate payment ability
- True liquidity without selling inventory

**Interpretation:**
- More conservative than current ratio
- Better for companies with slow-moving inventory
- Ratio > 1.0 = can meet obligations without inventory liquidation
- Especially important for distressed companies

**Rating System:**

| Rating | Quick Ratio | Interpretation |
|--------|-------------|----------------|
| Excellent | >2.0 | Very strong immediate liquidity |
| Good | 1.5-2.0 | Strong immediate liquidity |
| Acceptable | 1.0-1.5 | Adequate immediate liquidity |
| Concerning | 0.75-1.0 | Tight immediate liquidity |
| Poor | <0.75 | Insufficient liquid assets |

### Cash Ratio

**Formula:**
```
Cash Ratio = (Cash + Cash Equivalents) / Current Liabilities
```

**What It Measures:**
- Most conservative liquidity measure
- Ability to pay with cash only
- Ultimate solvency test

**Interpretation:**
- Strictest liquidity measure
- Ratio > 0.5 = strong cash position
- Useful in crisis scenarios
- Very few companies maintain ratio > 1.0

**Rating System:**

| Rating | Cash Ratio | Interpretation |
|--------|------------|----------------|
| Excellent | >1.0 | Exceptional cash position |
| Good | 0.75-1.0 | Strong cash reserves |
| Acceptable | 0.5-0.75 | Adequate cash cushion |
| Concerning | 0.25-0.5 | Limited cash reserves |
| Poor | <0.25 | Critically low cash |

### Operating Cash Flow Ratio

**Formula:**
```
Operating Cash Flow Ratio = Operating Cash Flow / Current Liabilities
```

**What It Measures:**
- Ability to cover obligations with cash from operations
- Quality of liquidity (operational vs. financing)
- Sustainable debt coverage

**Interpretation:**
- Ratio > 1.0 = operations generate enough cash to cover liabilities
- More sustainable than asset-based ratios
- Declining ratio = operational stress

**Rating System:**

| Rating | OCF Ratio | Interpretation |
|--------|-----------|----------------|
| Excellent | >1.0 | Operations easily cover liabilities |
| Good | 0.75-1.0 | Operations cover most liabilities |
| Acceptable | 0.5-0.75 | Operations cover half of liabilities |
| Concerning | 0.25-0.5 | Weak operational cash generation |
| Poor | <0.25 | Insufficient operational cash |

---

## Leverage Ratios

Measure financial risk and solvency through debt levels.

### Debt-to-Equity

**Formula:**
```
Debt-to-Equity = Total Debt / Total Equity
```

**What It Measures:**
- Financial leverage
- Risk from debt financing
- Capital structure

**Interpretation:**
- Higher ratio = more leverage = more risk
- Ratio > 2.0 = highly leveraged
- Growth companies often higher (using debt for expansion)
- Mature companies often lower (stable cash flow)

**Rating System:**

| Rating | D/E Ratio | Interpretation |
|--------|-----------|----------------|
| Excellent (Conservative) | <0.5 | Very low leverage, low risk |
| Good | 0.5-1.0 | Moderate leverage, balanced |
| Acceptable | 1.0-2.0 | Elevated leverage, manageable |
| Concerning | 2.0-3.0 | High leverage, increased risk |
| Poor | >3.0 | Excessive leverage, high risk |

**Industry-Specific:**
- Technology/SaaS: Target <1.0
- Manufacturing: Target <2.0
- Utilities: Can sustain 2.0-3.0 (stable cash flows)
- Financial services: Different framework (use Tier 1 capital ratios)

### Debt-to-Assets

**Formula:**
```
Debt-to-Assets = Total Debt / Total Assets
```

**What It Measures:**
- Proportion of assets financed by debt
- Asset coverage for debt
- Downside protection for creditors

**Interpretation:**
- Ratio of 0.5 = half of assets funded by debt
- Lower is safer for creditors
- Higher is riskier but offers more upside to equity holders

**Rating System:**

| Rating | D/A Ratio | Interpretation |
|--------|-----------|----------------|
| Excellent | <0.3 | Low debt burden |
| Good | 0.3-0.5 | Moderate debt burden |
| Acceptable | 0.5-0.7 | Elevated debt burden |
| Concerning | 0.7-0.85 | High debt burden |
| Poor | >0.85 | Excessive debt burden |

### Interest Coverage

**Formula:**
```
Interest Coverage = EBIT / Interest Expense
OR
Interest Coverage = EBITDA / Interest Expense
```

**What It Measures:**
- Ability to service debt from operations
- Margin of safety for debt payments
- Debt sustainability

**Interpretation:**
- Ratio > 5.0x = comfortable coverage
- Ratio < 2.0x = distress signal
- Higher is better (more cushion)
- EBITDA version is less conservative but commonly used

**Rating System:**

| Rating | Interest Coverage | Interpretation |
|--------|-------------------|----------------|
| Excellent | >10.0x | Debt easily serviced |
| Good | 5.0-10.0x | Healthy debt coverage |
| Acceptable | 3.0-5.0x | Adequate debt coverage |
| Concerning | 1.5-3.0x | Tight debt coverage |
| Poor | <1.5x | Cannot comfortably service debt |

### Debt Service Coverage Ratio (DSCR)

**Formula:**
```
DSCR = Operating Income / Total Debt Service
Total Debt Service = Principal Payments + Interest Payments
```

**What It Measures:**
- Ability to cover all debt obligations (principal + interest)
- Comprehensive debt sustainability
- Lender's key metric for loan approval

**Interpretation:**
- Ratio > 1.25x = minimum for most lenders
- Ratio < 1.0x = cannot cover debt payments (default risk)
- Higher ratio = easier to refinance

**Rating System:**

| Rating | DSCR | Interpretation |
|--------|------|----------------|
| Excellent | >2.0x | Very strong debt coverage |
| Good | 1.5-2.0x | Strong debt coverage |
| Acceptable | 1.25-1.5x | Adequate debt coverage (minimum lender requirement) |
| Concerning | 1.0-1.25x | Tight debt coverage |
| Poor | <1.0x | Insufficient cash to service debt |

### Net Debt to EBITDA

**Formula:**
```
Net Debt to EBITDA = (Total Debt - Cash) / EBITDA
```

**What It Measures:**
- Leverage relative to cash generation
- Years to pay off debt with EBITDA
- Common metric in leveraged finance

**Interpretation:**
- Ratio of 3.0x = 3 years of EBITDA to pay off net debt
- Lower is better (less leveraged)
- Used for covenant compliance
- Industry-specific (SaaS lower, utilities higher)

**Rating System:**

| Rating | Net Debt / EBITDA | Interpretation |
|--------|-------------------|----------------|
| Excellent | <1.0x | Minimal leverage |
| Good | 1.0-2.0x | Conservative leverage |
| Acceptable | 2.0-3.5x | Moderate leverage |
| Concerning | 3.5-5.0x | High leverage |
| Poor | >5.0x | Excessive leverage |

**Credit Rating Equivalent:**
- <1.5x: AAA/AA
- 1.5-2.5x: A/BBB
- 2.5-4.0x: BB/B
- >4.0x: CCC or below (junk)

---

## Efficiency Ratios

Measure how effectively a company uses its assets and manages operations.

### Asset Turnover

**Formula:**
```
Asset Turnover = Revenue / Total Assets
OR
Asset Turnover = Revenue / Average Total Assets
```

**What It Measures:**
- Revenue generation efficiency per dollar of assets
- Asset utilization
- Capital intensity

**Interpretation:**
- Higher is better (more revenue from same assets)
- Retail/wholesale naturally higher (low asset base)
- Manufacturing/telecom naturally lower (high asset base)
- Declining ratio = inefficient asset growth

**Industry Benchmarks:**

| Industry | Excellent | Good | Acceptable | Poor |
|----------|-----------|------|------------|------|
| **Retail** | >3.0x | 2.5-3.0x | 2.0-2.5x | <2.0x |
| **SaaS/Software** | >1.5x | 1.0-1.5x | 0.75-1.0x | <0.75x |
| **Manufacturing** | >1.5x | 1.0-1.5x | 0.75-1.0x | <0.75x |
| **Telecom/Utilities** | >0.75x | 0.5-0.75x | 0.3-0.5x | <0.3x |

### Inventory Turnover

**Formula:**
```
Inventory Turnover = Cost of Goods Sold / Average Inventory
```

**What It Measures:**
- How quickly inventory sells
- Inventory management efficiency
- Working capital efficiency

**Interpretation:**
- Higher is better (faster turnover = less capital tied up)
- Very high can signal stock-outs risk
- Very low signals obsolescence or overstock
- Industry-specific (groceries high, aircraft low)

**Industry Benchmarks:**

| Industry | Excellent | Good | Acceptable | Poor |
|----------|-----------|------|------------|------|
| **Grocery/Food** | >15x | 10-15x | 8-10x | <8x |
| **Retail (General)** | >10x | 7-10x | 5-7x | <5x |
| **Technology Hardware** | >8x | 6-8x | 4-6x | <4x |
| **Manufacturing** | >6x | 4-6x | 3-4x | <3x |
| **Automotive** | >12x | 9-12x | 6-9x | <6x |

### Days Sales Outstanding (DSO)

**Formula:**
```
DSO = (Accounts Receivable / Revenue) × 365
```

**What It Measures:**
- Average collection period in days
- Credit policy effectiveness
- Cash conversion speed

**Interpretation:**
- Lower is better (faster cash collection)
- Compare to payment terms (Net 30, Net 60)
- Rising DSO = collection issues or aggressive revenue recognition
- Industry-specific (B2B higher, B2C lower)

**Rating System:**

| Industry | Excellent | Good | Acceptable | Concerning |
|----------|-----------|------|------------|------------|
| **SaaS (annual contracts)** | <15 days | 15-30 days | 30-45 days | >45 days |
| **B2B Software** | <30 days | 30-45 days | 45-60 days | >60 days |
| **Consulting/Services** | <45 days | 45-60 days | 60-75 days | >75 days |
| **Manufacturing** | <45 days | 45-60 days | 60-75 days | >75 days |
| **Retail (B2C)** | <5 days | 5-10 days | 10-15 days | >15 days |

### Days Inventory Outstanding (DIO)

**Formula:**
```
DIO = (Inventory / Cost of Goods Sold) × 365
```

**What It Measures:**
- Days inventory sits before sale
- Inventory management efficiency
- Working capital tied up in inventory

**Interpretation:**
- Lower is better (less capital tied up)
- Too low = stock-out risk
- Rising DIO = slow sales or overproduction

**Industry Benchmarks:**

| Industry | Excellent | Good | Acceptable | Concerning |
|----------|-----------|------|------------|------------|
| **Grocery** | <20 days | 20-30 days | 30-40 days | >40 days |
| **Retail** | <30 days | 30-45 days | 45-60 days | >60 days |
| **Technology** | <40 days | 40-60 days | 60-90 days | >90 days |
| **Manufacturing** | <60 days | 60-90 days | 90-120 days | >120 days |

### Days Payable Outstanding (DPO)

**Formula:**
```
DPO = (Accounts Payable / Cost of Goods Sold) × 365
```

**What It Measures:**
- Days to pay suppliers
- Cash preservation
- Supplier relationship strength

**Interpretation:**
- Higher is better for cash (keep cash longer)
- Too high = damaged supplier relationships
- Compare to supplier terms
- Balance cash flow with vendor relations

**Rating System:**

| Rating | DPO | Interpretation |
|--------|-----|----------------|
| Excellent (Cash Management) | >60 days | Strong cash preservation |
| Good | 45-60 days | Balanced approach |
| Acceptable | 30-45 days | Standard payment terms |
| Concerning | <30 days | Weak negotiation or cash pressure |

### Cash Conversion Cycle (CCC)

**Formula:**
```
CCC = DSO + DIO - DPO
```

**What It Measures:**
- Days to convert investments into cash
- Working capital efficiency
- Overall operational efficiency

**Interpretation:**
- **Lower is better** (faster cash conversion)
- Negative CCC = paid before paying suppliers (ideal!)
- High CCC = capital tied up in operations
- Key metric for working capital management

**Rating System:**

| Rating | CCC | Interpretation |
|--------|-----|----------------|
| Excellent | <0 days (Negative) | Get paid before paying suppliers |
| Good | 0-30 days | Very efficient cash conversion |
| Acceptable | 30-60 days | Adequate cash conversion |
| Concerning | 60-90 days | Slow cash conversion |
| Poor | >90 days | Very slow cash conversion |

**Industry Benchmarks:**

| Industry | Typical CCC |
|----------|-------------|
| **Retail (Amazon, Walmart)** | Negative to 10 days |
| **SaaS (upfront annual billing)** | Negative to 15 days |
| **Technology Manufacturing** | 40-80 days |
| **Traditional Manufacturing** | 60-120 days |
| **Construction** | 90+ days |

---

## Valuation Ratios

Market-based ratios comparing company value to financial metrics.

### Price-to-Earnings (P/E)

**Formula:**
```
P/E Ratio = Market Price per Share / Earnings per Share (EPS)
OR
P/E Ratio = Market Capitalization / Net Income
```

**What It Measures:**
- Market valuation relative to profitability
- Investor expectations for growth
- Relative value vs. peers

**Interpretation:**
- Higher P/E = market expects higher growth
- Lower P/E = value stock or pessimism
- Meaningless if earnings are negative
- Compare to industry peers and historical average

**Benchmarks by Growth Profile:**

| Growth Profile | P/E Range | Examples |
|----------------|-----------|----------|
| **High Growth (>30% YoY)** | 40-100+ | Early SaaS, hot tech |
| **Growth (15-30% YoY)** | 25-40 | Established growth tech |
| **Moderate Growth (5-15%)** | 15-25 | Mature tech, healthcare |
| **Slow Growth (<5%)** | 10-15 | Utilities, mature industrials |
| **Value / Cyclical** | <10 | Banks, automotive, commodities |

### Price-to-Book (P/B)

**Formula:**
```
P/B Ratio = Market Price per Share / Book Value per Share
Book Value per Share = (Total Assets - Total Liabilities) / Shares Outstanding
```

**What It Measures:**
- Market value vs. accounting value
- Premium/discount to liquidation value
- Asset-based valuation

**Interpretation:**
- P/B > 1.0 = market values above book value (normal for profitable companies)
- P/B < 1.0 = trading below book value (distress or asset writedowns)
- More relevant for asset-heavy businesses (banks, real estate)
- Less relevant for asset-light businesses (software, services)

**Industry Benchmarks:**

| Industry | Typical P/B |
|----------|-------------|
| **SaaS/Software** | 5-20x (intangible value, not on balance sheet) |
| **Technology** | 3-8x |
| **Banks** | 0.8-1.5x (closer to book value) |
| **Manufacturing** | 1.5-3.0x |
| **Retail** | 2-5x |

### Price-to-Sales (P/S)

**Formula:**
```
P/S Ratio = Market Capitalization / Revenue
OR
P/S Ratio = Market Price per Share / Revenue per Share
```

**What It Measures:**
- Valuation relative to sales
- Useful for unprofitable growth companies
- Revenue quality assessment

**Interpretation:**
- Higher P/S = market expects strong margins and growth
- Useful when earnings are negative (growth companies)
- Compare gross margin when comparing P/S (higher margin justifies higher P/S)
- Revenue quality matters (recurring > transactional)

**Industry Benchmarks:**

| Industry | Typical P/S | High-Growth P/S |
|----------|-------------|-----------------|
| **SaaS (recurring revenue)** | 5-15x | 15-30x+ |
| **E-commerce** | 1-3x | 3-8x |
| **Technology** | 3-8x | 8-15x |
| **Retail** | 0.5-1.5x | 1.5-3x |
| **Manufacturing** | 0.5-2x | 2-4x |

### EV/Revenue

**Formula:**
```
EV/Revenue = Enterprise Value / Revenue

Enterprise Value = Market Cap + Total Debt - Cash
```

**What It Measures:**
- Total company value relative to sales
- Removes capital structure differences
- Better for M&A comparisons than P/S

**Interpretation:**
- Similar to P/S but includes debt
- Better for comparing companies with different leverage
- Standard metric in M&A transactions

**Benchmarks:** (Similar to P/S but typically 0.5-1.0x lower due to debt inclusion)

### EV/EBITDA

**Formula:**
```
EV/EBITDA = Enterprise Value / EBITDA

Enterprise Value = Market Cap + Total Debt - Cash
```

**What It Measures:**
- Most common valuation multiple
- Total company value relative to cash profitability
- Removes capital structure and tax differences

**Interpretation:**
- Industry standard for M&A
- Ratio of 10x = company valued at 10 years of EBITDA
- Higher multiples = growth expectations or competitive advantages
- Compare to public comps and precedent transactions

**Industry Benchmarks:**

| Industry | Typical EV/EBITDA | High-Growth EV/EBITDA |
|----------|-------------------|----------------------|
| **SaaS** | 10-20x | 20-40x+ |
| **Technology** | 12-18x | 18-30x |
| **Healthcare** | 10-15x | 15-25x |
| **Retail** | 6-10x | 10-15x |
| **Manufacturing** | 8-12x | 12-18x |
| **Utilities** | 8-12x | 12-15x |

### PEG Ratio

**Formula:**
```
PEG Ratio = P/E Ratio / Earnings Growth Rate (%)
```

**What It Measures:**
- P/E adjusted for growth
- Value relative to growth expectations
- Growth-adjusted valuation

**Interpretation:**
- PEG = 1.0 = fairly valued (P/E matches growth rate)
- PEG < 1.0 = potentially undervalued (cheap for growth)
- PEG > 2.0 = potentially overvalued (expensive for growth)
- Only works for profitable, growing companies

**Rating System:**

| PEG Ratio | Interpretation |
|-----------|----------------|
| <0.5 | Significantly undervalued |
| 0.5-1.0 | Undervalued |
| 1.0-1.5 | Fairly valued |
| 1.5-2.0 | Moderately overvalued |
| >2.0 | Significantly overvalued |

---

## Per-Share Metrics

### Earnings Per Share (EPS)

**Formula:**
```
Basic EPS = (Net Income - Preferred Dividends) / Weighted Average Shares Outstanding

Diluted EPS = (Net Income - Preferred Dividends) / (Shares + Options + Convertibles)
```

**What It Measures:**
- Profitability allocated to each share
- Shareholder value creation
- Basis for P/E ratio

**Interpretation:**
- Higher is better
- Growth in EPS over time = value creation
- Diluted EPS more conservative (includes stock options)
- Can be manipulated via buybacks

### Book Value Per Share

**Formula:**
```
Book Value Per Share = (Total Equity - Preferred Equity) / Shares Outstanding
```

**What It Measures:**
- Accounting value per share
- Liquidation value proxy
- Net asset value

### Free Cash Flow Per Share

**Formula:**
```
FCF Per Share = Free Cash Flow / Shares Outstanding
```

**What It Measures:**
- Cash generation per share
- More reliable than EPS (harder to manipulate)
- True shareholder value

**Interpretation:**
- Compare to Price per Share (P/FCF ratio)
- Higher FCF/Share = stronger cash generation
- Growth in FCF/Share = sustainable value creation

---

## SaaS & Tech Specific Metrics

### Rule of 40

**Formula:**
```
Rule of 40 = Revenue Growth Rate (%) + EBITDA Margin (%)
OR
Rule of 40 = Revenue Growth Rate (%) + Free Cash Flow Margin (%)
```

**What It Measures:**
- Efficiency of balancing growth and profitability
- SaaS company health
- Capital efficiency

**Interpretation:**
- **Target ≥40%** for healthy SaaS companies
- Can achieve via high growth + low margins OR moderate growth + high margins
- <40% = need to improve growth or profitability
- >40% = efficient growth

**Rating System:**

| Rule of 40 Score | Rating | Interpretation |
|------------------|--------|----------------|
| >60% | Excellent | Elite SaaS company |
| 50-60% | Good | Strong SaaS company |
| 40-50% | Acceptable | Healthy SaaS company |
| 30-40% | Concerning | Needs improvement |
| <30% | Poor | Inefficient growth or profitability |

**Examples:**
- Company A: 80% growth + (-20%) EBITDA margin = 60% (excellent)
- Company B: 30% growth + 25% EBITDA margin = 55% (good)
- Company C: 20% growth + 15% EBITDA margin = 35% (concerning)

### Magic Number

**Formula:**
```
Magic Number = Net New ARR (Quarter) / Sales & Marketing Spend (Prior Quarter)
```

**What It Measures:**
- Sales efficiency
- Return on sales & marketing investment
- Payback on customer acquisition

**Interpretation:**
- Measures how much ARR is generated per dollar of S&M spend
- Higher is better (more efficient growth)
- <0.5 = poor efficiency (burning cash)
- >1.0 = excellent efficiency (strong unit economics)

**Rating System:**

| Magic Number | Rating | Interpretation |
|--------------|--------|----------------|
| >1.0 | Excellent | Very efficient growth engine |
| 0.75-1.0 | Good | Efficient growth |
| 0.5-0.75 | Acceptable | Adequate efficiency |
| 0.25-0.5 | Concerning | Poor efficiency |
| <0.25 | Poor | Severely inefficient |

### CAC Payback Period

**Formula:**
```
CAC Payback = Customer Acquisition Cost / (Monthly Recurring Revenue × Gross Margin %)
```

**What It Measures:**
- Months to recover customer acquisition cost
- Speed of investment return
- Working capital efficiency

**Interpretation:**
- Faster payback = better (less capital tied up)
- <6 months = excellent
- 12-18 months = acceptable
- >24 months = concerning (too long to recover investment)

**Rating System:**

| CAC Payback | Rating | Interpretation |
|-------------|--------|----------------|
| <6 months | Excellent | Very fast payback |
| 6-12 months | Good | Fast payback |
| 12-18 months | Acceptable | Standard payback |
| 18-24 months | Concerning | Slow payback |
| >24 months | Poor | Too slow to recover |

### LTV/CAC Ratio

**Formula:**
```
LTV/CAC = Customer Lifetime Value / Customer Acquisition Cost

LTV = (Average Revenue per Customer / Month) × Gross Margin % / Monthly Churn Rate
```

**What It Measures:**
- Long-term profitability of customer acquisition
- Unit economics health
- Sustainable growth potential

**Interpretation:**
- Ratio >3.0x = healthy unit economics
- Ratio <1.0x = losing money on every customer (unsustainable)
- Target 3.0-5.0x for efficient growth
- >5.0x = potentially under-investing in growth

**Rating System:**

| LTV/CAC Ratio | Rating | Interpretation |
|---------------|--------|----------------|
| >5.0x | Excellent | Could invest more in growth |
| 3.0-5.0x | Good | Healthy unit economics |
| 2.0-3.0x | Acceptable | Marginal unit economics |
| 1.0-2.0x | Concerning | Weak unit economics |
| <1.0x | Poor | Losing money on customers |

### Net Dollar Retention (NDR)

**Formula:**
```
NDR = ((Starting ARR + Expansion ARR - Churned ARR - Contraction ARR) / Starting ARR) × 100
```

**What It Measures:**
- Revenue retention from existing customers including expansion
- Product stickiness and expansion opportunity
- Revenue quality

**Interpretation:**
- >100% = revenue grows from existing customers (expansion > churn)
- <100% = revenue declines from existing customers
- Best-in-class: >120%
- Target for healthy SaaS: >100%

**Rating System:**

| NDR | Rating | Interpretation |
|-----|--------|----------------|
| >130% | Excellent | Elite expansion and retention |
| 120-130% | Good | Strong expansion and retention |
| 110-120% | Acceptable | Solid expansion and retention |
| 100-110% | Concerning | Minimal expansion, moderate churn |
| <100% | Poor | Churn exceeds expansion |

### Burn Multiple

**Formula:**
```
Burn Multiple = Net Burn / Net New ARR
```

**What It Measures:**
- Capital efficiency for growth
- Dollars burned per dollar of ARR added
- Investor's key metric for capital deployment

**Interpretation:**
- Lower is better (less burn per ARR growth)
- <1.0x = very efficient
- >2.0x = inefficient (burning too much for growth achieved)

**Rating System:**

| Burn Multiple | Rating | Interpretation |
|---------------|--------|----------------|
| <0.5x | Excellent | Extremely efficient growth |
| 0.5-1.0x | Good | Efficient growth |
| 1.0-1.5x | Acceptable | Adequate efficiency |
| 1.5-2.0x | Concerning | Inefficient growth |
| >2.0x | Poor | Very inefficient growth |

---

## Industry Benchmarks

Comprehensive benchmarks across five major industries.

### Technology / SaaS

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Gross Margin | >80% | 70-80% | 60-70% | <60% |
| Operating Margin | >30% | 20-30% | 10-20% | <10% |
| Net Margin | >20% | 10-20% | 5-10% | <5% |
| EBITDA Margin | >40% | 30-40% | 20-30% | <20% |
| Current Ratio | >2.0 | 1.5-2.0 | 1.0-1.5 | <1.0 |
| Debt/Equity | <0.5 | 0.5-1.0 | 1.0-1.5 | >1.5 |
| ROE | >25% | 18-25% | 12-18% | <12% |
| ROIC | >20% | 15-20% | 10-15% | <10% |
| P/E Ratio | 30-50 | 20-30 | 15-20 | <15 or >50 |
| EV/Revenue | 8-15x | 5-8x | 3-5x | <3x |
| EV/EBITDA | 15-25x | 12-15x | 10-12x | <10x |
| Rule of 40 | >60% | 50-60% | 40-50% | <40% |
| LTV/CAC | >5.0x | 3.0-5.0x | 2.0-3.0x | <2.0x |
| NDR | >130% | 120-130% | 110-120% | <110% |

### Retail

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Gross Margin | >50% | 40-50% | 30-40% | <30% |
| Operating Margin | >10% | 5-10% | 3-5% | <3% |
| Net Margin | >8% | 5-8% | 3-5% | <3% |
| Current Ratio | >1.5 | 1.2-1.5 | 1.0-1.2 | <1.0 |
| Debt/Equity | <1.0 | 1.0-1.5 | 1.5-2.0 | >2.0 |
| ROE | >15% | 12-15% | 8-12% | <8% |
| Inventory Turnover | >10x | 7-10x | 5-7x | <5x |
| DSO | <10 days | 10-15 days | 15-25 days | >25 days |
| Asset Turnover | >3.0x | 2.5-3.0x | 2.0-2.5x | <2.0x |
| P/E Ratio | 20-30 | 15-20 | 10-15 | <10 or >30 |

### Manufacturing

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Gross Margin | >40% | 30-40% | 25-30% | <25% |
| Operating Margin | >15% | 10-15% | 5-10% | <5% |
| Net Margin | >10% | 7-10% | 4-7% | <4% |
| Current Ratio | >2.0 | 1.5-2.0 | 1.2-1.5 | <1.2 |
| Debt/Equity | <1.5 | 1.5-2.0 | 2.0-2.5 | >2.5 |
| ROE | >18% | 13-18% | 8-13% | <8% |
| Inventory Turnover | >8x | 6-8x | 4-6x | <4x |
| Asset Turnover | >1.5x | 1.0-1.5x | 0.75-1.0x | <0.75x |
| P/E Ratio | 18-25 | 13-18 | 10-13 | <10 or >25 |

### Financial Services

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Operating Margin | >30% | 25-30% | 20-25% | <20% |
| Net Margin | >25% | 20-25% | 15-20% | <15% |
| ROE | >15% | 12-15% | 10-12% | <10% |
| ROA | >1.5% | 1.0-1.5% | 0.75-1.0% | <0.75% |
| Tier 1 Capital Ratio | >12% | 10-12% | 8-10% | <8% |
| Non-Performing Loan % | <1% | 1-2% | 2-3% | >3% |
| Efficiency Ratio | <50% | 50-60% | 60-70% | >70% |
| P/E Ratio | 15-20 | 12-15 | 10-12 | <10 or >20 |
| P/B Ratio | 1.5-2.5x | 1.0-1.5x | 0.8-1.0x | <0.8x |

### Healthcare

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Gross Margin | >60% | 50-60% | 40-50% | <40% |
| Operating Margin | >20% | 15-20% | 10-15% | <10% |
| Net Margin | >15% | 10-15% | 5-10% | <5% |
| Current Ratio | >2.0 | 1.5-2.0 | 1.2-1.5 | <1.2 |
| Debt/Equity | <1.0 | 1.0-1.5 | 1.5-2.0 | >2.0 |
| ROE | >20% | 15-20% | 10-15% | <10% |
| DSO | <50 days | 50-65 days | 65-80 days | >80 days |
| P/E Ratio | 25-35 | 18-25 | 15-18 | <15 or >35 |

---

## Ratio Analysis Framework

### Step-by-Step Analysis Process

**1. Gather Financial Statements**
- Income Statement (3+ years)
- Balance Sheet (3+ years)
- Cash Flow Statement (3+ years)
- Industry comparables data

**2. Calculate All Ratios**
- Profitability ratios
- Liquidity ratios
- Leverage ratios
- Efficiency ratios
- Valuation ratios (if public)

**3. Analyze Trends**
- Are ratios improving or deteriorating?
- What's driving the changes?
- Are changes sustainable?

**4. Compare to Benchmarks**
- Industry peers
- Industry averages
- Historical company performance
- Best-in-class targets

**5. Identify Strengths and Weaknesses**
- What's working well?
- What needs improvement?
- What are the biggest risks?

**6. Synthesize Insights**
- Overall financial health assessment
- Key opportunities
- Critical risks
- Recommended actions

---

## Rating System

### Comprehensive Company Rating Scorecard

Use this framework to rate overall financial health:

**Profitability (30% weight):**
- Gross Margin: ___% (Rating: ___)
- Operating Margin: ___% (Rating: ___)
- Net Margin: ___% (Rating: ___)
- ROIC: ___% (Rating: ___)
- **Profitability Score:** (Average of ratings)

**Liquidity (20% weight):**
- Current Ratio: ___ (Rating: ___)
- Quick Ratio: ___ (Rating: ___)
- Cash Ratio: ___ (Rating: ___)
- **Liquidity Score:** (Average of ratings)

**Leverage (20% weight):**
- Debt/Equity: ___ (Rating: ___)
- Interest Coverage: ___x (Rating: ___)
- Net Debt/EBITDA: ___x (Rating: ___)
- **Leverage Score:** (Average of ratings)

**Efficiency (20% weight):**
- Asset Turnover: ___x (Rating: ___)
- Cash Conversion Cycle: ___ days (Rating: ___)
- Inventory Turnover: ___x (Rating: ___)
- **Efficiency Score:** (Average of ratings)

**Growth/Valuation (10% weight):**
- Revenue Growth: ___% (Rating: ___)
- EV/EBITDA: ___x (Rating: ___)
- P/E Ratio: ___x (Rating: ___)
- **Growth/Valuation Score:** (Average of ratings)

### Overall Financial Health Rating

```
Overall Score = (Profitability × 0.30) + (Liquidity × 0.20) + (Leverage × 0.20) + (Efficiency × 0.20) + (Growth/Valuation × 0.10)
```

**Rating Scale:**
- **4.0-5.0:** Excellent - Very strong financial health
- **3.0-4.0:** Good - Solid financial health
- **2.0-3.0:** Acceptable - Adequate financial health
- **1.0-2.0:** Concerning - Weak financial health
- **0.0-1.0:** Poor - Critical financial issues

---

**This comprehensive ratio analysis framework enables CFO-level financial assessment for strategic decision-making, investment evaluation, and risk management.**
