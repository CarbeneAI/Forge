# Google Sheet Setup for Call Intelligence

## Create the Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet named: **Call Intelligence**
3. Create two tabs (sheets):
   - **Sales Calls**
   - **Customer Success Calls**

## Sales Calls Tab

### Column Headers (Row 1)

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Date | Client | Summary | Competitors | Objections | Feature Requests | Deal Probability | Next Steps |

### Column Formatting

| Column | Format | Width |
|--------|--------|-------|
| A (Date) | Date (YYYY-MM-DD) | 100px |
| B (Client) | Text | 150px |
| C (Summary) | Text, Wrap | 300px |
| D (Competitors) | Text | 200px |
| E (Objections) | Text, Wrap | 250px |
| F (Feature Requests) | Text, Wrap | 250px |
| G (Deal Probability) | Number (0-100) | 100px |
| H (Next Steps) | Text, Wrap | 300px |

### Conditional Formatting (Optional)

- **Deal Probability**:
  - Red background if < 30%
  - Yellow background if 30-60%
  - Green background if > 60%

## Customer Success Calls Tab

### Column Headers (Row 1)

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Date | Client | Summary | Feature Requests | Recurring Issues | Expansion Signals | Sentiment | Follow-up |

### Column Formatting

| Column | Format | Width |
|--------|--------|-------|
| A (Date) | Date (YYYY-MM-DD) | 100px |
| B (Client) | Text | 150px |
| C (Summary) | Text, Wrap | 300px |
| D (Feature Requests) | Text, Wrap | 250px |
| E (Recurring Issues) | Text, Wrap | 250px |
| F (Expansion Signals) | Text, Wrap | 250px |
| G (Sentiment) | Number (1-10) | 80px |
| H (Follow-up) | Text, Wrap | 300px |

### Conditional Formatting (Optional)

- **Sentiment**:
  - Red background if 1-3
  - Yellow background if 4-6
  - Green background if 7-10

## Share Settings

If using service account for n8n:
1. Click **Share** button
2. Add the service account email (from your Google Cloud credentials)
3. Give **Editor** access

## Get the Sheet ID

The Sheet ID is in the URL:
```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```

You'll need this ID for the n8n workflow configuration.

## n8n Connection

The n8n workflow uses the Google Sheets node with:
- **Credential**: Your existing Google Sheets OAuth2 credential
- **Operation**: Append Row
- **Document ID**: The Sheet ID from above
- **Sheet Name**: "Sales Calls" or "Customer Success Calls" (based on call type)

## Data Format

The n8n workflow will format data as:
- Arrays (competitors, objections, etc.) → Comma-separated string
- Date → YYYY-MM-DD format
- Numbers → Raw numbers (no % symbol)
