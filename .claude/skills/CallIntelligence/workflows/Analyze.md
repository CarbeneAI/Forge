# Analyze Call Transcript

Extract structured intelligence from a call transcript.

## Prerequisites

- Call transcript (from PLAUD or other source)
- Client/company name
- Call type (sales or customer_success)

## Steps

### 1. Identify Call Type

Determine if this is a:
- **Sales call** - Prospect/lead call, demo, discovery, negotiation
- **Customer Success call** - Existing customer, check-in, support, review

### 2. Apply Analysis Pattern

Read and apply the `extract_call_intelligence` Fabric pattern:

```bash
# Pattern location
cat ${PAI_DIR}/skills/Fabric/tools/patterns/extract_call_intelligence/system.md
```

Apply the pattern to the transcript with the call type context.

### 3. Extract Intelligence

For **Sales Calls**, extract:
- Summary (2-3 sentences)
- Competitors mentioned
- Objections raised
- Feature requests
- Deal probability (0-100%)
- Next steps

For **Customer Success Calls**, extract:
- Summary (2-3 sentences)
- Feature requests
- Recurring issues
- Expansion signals
- Sentiment (1-10)
- Follow-up required

### 4. Format Output

Return structured JSON:

```json
{
  "call_type": "sales",
  "client": "Acme Corp",
  "date": "2026-02-05",
  "summary": "...",
  "competitors": [...],
  "objections": [...],
  "feature_requests": [...],
  "deal_probability": 65,
  "next_steps": [...]
}
```

### 5. Optional: Append to Google Sheet

If configured, append the analysis to the Call Intelligence Google Sheet:

```bash
bun ${PAI_DIR}/skills/CallIntelligence/tools/AppendToSheet.ts < analysis.json
```

### 6. Optional: Notify Discord

Post summary to Discord via Barnabas:

```
📞 New Call Analyzed: {client}
Type: {call_type}
Summary: {summary}
Deal Probability: {deal_probability}%
```

## CLI Usage

```bash
# From inline transcript
bun ${PAI_DIR}/skills/CallIntelligence/tools/AnalyzeCall.ts \
  --type sales \
  --client "Acme Corp" \
  --transcript "Hi, thanks for joining today..."

# From file
bun ${PAI_DIR}/skills/CallIntelligence/tools/AnalyzeCall.ts \
  --type customer_success \
  --client "Beta Inc" \
  < transcript.txt
```
