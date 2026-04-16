# n8n Workflow Setup

## Prerequisites

1. n8n instance running (https://n8n.home.yourdomain.com)
2. Google Sheets OAuth2 credential configured
3. Anthropic API key
4. Discord webhook URL (optional)

## Step 1: Create Anthropic Credential

1. Go to n8n → Settings → Credentials
2. Click "Add Credential"
3. Search for "Header Auth"
4. Configure:
   - **Name**: Anthropic API
   - **Name (Header)**: x-api-key
   - **Value**: Your ANTHROPIC_API_KEY

## Step 2: Create the Google Sheet

Follow instructions in `GoogleSheetSetup.md` to create:
- Sheet named "Call Intelligence"
- Tab 1: "Sales Calls"
- Tab 2: "Customer Success Calls"

Note the Sheet ID from the URL.

## Step 3: Get Discord Webhook (Optional)

1. In Discord, go to your channel settings
2. Integrations → Webhooks → New Webhook
3. Copy the webhook URL

## Step 4: Import Workflow

1. Go to n8n → Workflows
2. Click "Import from File"
3. Select `n8n-workflow.json`
4. The workflow will be imported with placeholder values

## Step 5: Configure Nodes

### Analyze with Claude node
- Update the HTTP Header Auth credential to use "Anthropic API"

### Google Sheets nodes (both)
- Update `documentId` with your Sheet ID
- Update credential to your Google Sheets OAuth2

### Discord nodes (both)
- Update the webhook URL with your Discord webhook

## Step 6: Activate Workflow

1. Toggle the workflow to "Active"
2. Note the webhook URL (shown in the Webhook node)
3. Test with a sample request

## Testing

Send a test POST request:

```bash
curl -X POST https://n8n.home.yourdomain.com/webhook/call-intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "client": "Test Company",
    "call_type": "sales",
    "transcript": "Hi, thanks for joining. We are evaluating your solution against Competitor X. Our main concern is pricing - your solution is 30% more expensive. We would need SSO integration before we could proceed. Can you send a proposal by Friday?"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Call analyzed and recorded",
  "analysis": {
    "call_type": "sales",
    "client": "Test Company",
    "summary": "Initial call with Test Company evaluating against Competitor X...",
    "competitors": ["Competitor X"],
    "objections": ["Pricing - 30% more expensive"],
    "feature_requests": ["SSO integration"],
    "deal_probability": 45,
    "next_steps": ["Send proposal by Friday"]
  }
}
```

## Webhook Form (Optional)

For a user-friendly form interface, you can:

1. Create a simple HTML form page
2. Host it at calls.home.yourdomain.com
3. Form POSTs to the n8n webhook

See `form.html` for a ready-to-use form template.
