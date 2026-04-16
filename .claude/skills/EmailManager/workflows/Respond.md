# Respond Workflow

Draft and send email replies with AI assistance.

## Overview

This workflow handles email response drafting using Claude Sonnet. All responses require user approval before sending.

## Steps

### 1. Analyze Email for Response Needs

```bash
bun ~/.claude/skills/EmailManager/tools/ResponseDrafter.ts analyze --account <account> --message-id <id>
```

Returns:
- `requiresResponse`: Whether a response is needed
- `urgency`: high/medium/low
- `questionsAsked`: Questions that need answers
- `actionItemsRequested`: Action items requested

### 2. Get Quick Reply Suggestions (Optional)

For simple responses:

```bash
bun ~/.claude/skills/EmailManager/tools/ResponseDrafter.ts quick --account <account> --message-id <id>
```

Returns 3-4 one-liner suggestions.

### 3. Draft Full Reply

For detailed responses:

```bash
bun ~/.claude/skills/EmailManager/tools/ResponseDrafter.ts draft \
  --account <account> \
  --message-id <id> \
  --intent "your intent" \
  --tone professional|friendly|casual|formal \
  --include-thread
```

Options:
- `--intent`: What you want to communicate (e.g., "politely decline", "accept with conditions")
- `--tone`: Response tone (default: professional)
- `--include-thread`: Include full email thread for context

### 4. Review Draft

The draft command returns:
- `subject`: Suggested subject line
- `body`: Draft body text
- `reasoning`: Why this approach was chosen
- `warnings`: Any concerns to review

**User must review and approve before sending.**

### 5. Send Approved Response

```bash
bun ~/.claude/skills/EmailManager/tools/ResponseDrafter.ts send \
  --account <account> \
  --message-id <id> \
  --draft "Your approved draft text..." \
  --subject "Re: Subject Line"
```

## Example Usage

```bash
# 1. Analyze the email
bun ResponseDrafter.ts analyze --account personal --message-id abc123

# 2. Draft a reply
bun ResponseDrafter.ts draft --account personal --message-id abc123 \
  --intent "accept the meeting but suggest a different time" \
  --tone friendly \
  --include-thread

# 3. Review the draft output...

# 4. Send after approval
bun ResponseDrafter.ts send --account personal --message-id abc123 \
  --draft "Hi John,\n\nThanks for reaching out! I'd love to meet, but Wednesday doesn't work for me. Would Thursday at 2pm work instead?\n\nBest,\nClint"
```

## Tone Guide

| Tone | Use When |
|------|----------|
| `professional` | Business emails, formal requests (default) |
| `friendly` | Colleagues, casual business relationships |
| `casual` | Personal contacts, informal requests |
| `formal` | Executive communication, legal matters |

## Safety

- **All responses require user approval** - no auto-sending
- Drafts are saved to `data/drafts/` for reference
- Original email context preserved for audit
