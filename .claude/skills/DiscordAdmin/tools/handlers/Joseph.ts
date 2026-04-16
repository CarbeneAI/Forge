/**
 * Joseph.ts - Joseph Trading handler for Discord Bot
 *
 * Routes commands from #joseph-trading channel to the DashboardServer API.
 * All commands are read-only (Phase 1).
 */

import { DiscordClient, DiscordMessage } from '../lib/DiscordClient';
import { ClaudeClient } from '../../../TelegramBot/tools/lib/ClaudeClient';
import { ConversationState } from '../../../TelegramBot/tools/lib/ConversationState';

const DASHBOARD_URL = process.env.TRADING_DASHBOARD_URL || 'http://localhost:8083';

// ============================================================================
// Logging
// ============================================================================

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [Joseph] ${message}`);
}

// ============================================================================
// API Helper
// ============================================================================

async function fetchDashboard(path: string): Promise<unknown> {
  const response = await fetch(`${DASHBOARD_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Dashboard API error (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

// ============================================================================
// Formatters
// ============================================================================

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatPL(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatCurrency(value)}`;
}

// ============================================================================
// Command Handlers
// ============================================================================

async function handlePositions(message: DiscordMessage, discord: DiscordClient): Promise<void> {
  const channelId = message.channel_id;

  try {
    const [positions, account] = await Promise.all([
      fetchDashboard('/api/positions') as Promise<Array<{
        symbol: string; qty: number; avg_entry_price: number;
        current_price: number; unrealized_pl: number; unrealized_plpc: number;
        market_value: number;
      }>>,
      fetchDashboard('/api/account') as Promise<{
        equity: number; buying_power: number;
      }>,
    ]);

    if (!positions || positions.length === 0) {
      await discord.send(channelId, '**Open Positions:** None\n\n*No active trades.*');
      return;
    }

    let text = `**Open Positions** (${positions.length})\n\n`;
    text += '```\n';
    text += 'Symbol   Qty   Entry      Current    P&L         %\n';
    text += '─'.repeat(60) + '\n';

    let totalPL = 0;
    for (const p of positions) {
      const qty = Number(p.qty);
      const entry = Number(p.avg_entry_price);
      const current = Number(p.current_price);
      const pl = Number(p.unrealized_pl);
      const plpc = Number(p.unrealized_plpc) * 100;
      totalPL += pl;

      const sym = p.symbol.padEnd(8);
      const qtyStr = String(qty).padStart(4);
      const entryStr = formatCurrency(entry).padStart(10);
      const curStr = formatCurrency(current).padStart(10);
      const plStr = formatPL(pl).padStart(11);
      const pctStr = formatPercent(plpc).padStart(7);

      text += `${sym} ${qtyStr} ${entryStr} ${curStr} ${plStr} ${pctStr}\n`;
    }

    text += '─'.repeat(60) + '\n';
    text += `Total P&L: ${formatPL(totalPL)}\n`;
    text += '```';

    await discord.send(channelId, text);
  } catch (error) {
    log(`Positions error: ${error}`);
    await discord.send(channelId, `Failed to fetch positions: ${error}`);
  }
}

async function handlePortfolio(message: DiscordMessage, discord: DiscordClient): Promise<void> {
  const channelId = message.channel_id;

  try {
    const account = await fetchDashboard('/api/account') as {
      equity: string; buying_power: string; cash: string;
      portfolio_value: string; last_equity: string;
    };

    const equity = Number(account.equity);
    const buyingPower = Number(account.buying_power);
    const cash = Number(account.cash);
    const portfolioValue = Number(account.portfolio_value);
    const lastEquity = Number(account.last_equity);
    const dayPL = equity - lastEquity;
    const dayPLPct = lastEquity > 0 ? (dayPL / lastEquity) * 100 : 0;

    const text = `**Portfolio Summary**

**Equity:** ${formatCurrency(equity)}
**Cash:** ${formatCurrency(cash)}
**Buying Power:** ${formatCurrency(buyingPower)}
**Portfolio Value:** ${formatCurrency(portfolioValue)}

**Day P&L:** ${formatPL(dayPL)} (${formatPercent(dayPLPct)})`;

    await discord.send(channelId, text);
  } catch (error) {
    log(`Portfolio error: ${error}`);
    await discord.send(channelId, `Failed to fetch portfolio: ${error}`);
  }
}

async function handleScan(message: DiscordMessage, discord: DiscordClient): Promise<void> {
  const channelId = message.channel_id;

  try {
    const recs = await fetchDashboard('/api/recommendations') as Array<{
      symbol: string; action: string; source: string;
      conviction: string; research_score?: number;
      rationale?: string; timestamp?: string;
    }>;

    if (!recs || recs.length === 0) {
      await discord.send(channelId, '**Latest Scan:** No recommendations found.\n\n*Run a scan or wait for the next scheduled scan.*');
      return;
    }

    let text = `**Latest Recommendations** (${recs.length})\n\n`;

    for (const r of recs) {
      const score = r.research_score != null ? ` | Score: ${r.research_score}` : '';
      text += `**${r.symbol}** — ${r.action} (${r.conviction}${score})\n`;
      text += `Source: ${r.source}`;
      if (r.rationale) text += ` | ${r.rationale.substring(0, 100)}`;
      text += '\n\n';
    }

    await discord.send(channelId, text.trim());
  } catch (error) {
    log(`Scan error: ${error}`);
    await discord.send(channelId, `Failed to fetch recommendations: ${error}`);
  }
}

async function handleReport(message: DiscordMessage, discord: DiscordClient): Promise<void> {
  const channelId = message.channel_id;

  try {
    const dailyPL = await fetchDashboard('/api/daily-pl') as Array<{
      date: string; pl: number; equity: number;
    }>;

    if (!dailyPL || dailyPL.length === 0) {
      await discord.send(channelId, '**Performance Report:** No daily P&L data available.');
      return;
    }

    // Show last 10 days
    const recent = dailyPL.slice(-10);
    let text = '**Recent Performance**\n\n```\n';
    text += 'Date         P&L          Equity\n';
    text += '─'.repeat(45) + '\n';

    for (const d of recent) {
      const date = d.date.padEnd(12);
      const pl = formatPL(d.pl).padStart(12);
      const eq = formatCurrency(d.equity).padStart(14);
      text += `${date} ${pl} ${eq}\n`;
    }

    text += '```';
    await discord.send(channelId, text);
  } catch (error) {
    log(`Report error: ${error}`);
    await discord.send(channelId, `Failed to fetch report: ${error}`);
  }
}

async function handleLearnings(message: DiscordMessage, discord: DiscordClient): Promise<void> {
  const channelId = message.channel_id;

  try {
    const learnings = await fetchDashboard('/api/learnings') as Array<{
      id?: string; learning: string; category?: string;
      created_at?: string; active?: boolean;
    }>;

    if (!learnings || learnings.length === 0) {
      await discord.send(channelId, '**Trading Learnings:** None recorded yet.');
      return;
    }

    const active = learnings.filter(l => l.active !== false);
    let text = `**Active Trading Learnings** (${active.length})\n\n`;

    for (const l of active.slice(0, 15)) {
      const cat = l.category ? ` [${l.category}]` : '';
      text += `• ${l.learning}${cat}\n`;
    }

    if (active.length > 15) {
      text += `\n*...and ${active.length - 15} more*`;
    }

    await discord.send(channelId, text);
  } catch (error) {
    log(`Learnings error: ${error}`);
    await discord.send(channelId, `Failed to fetch learnings: ${error}`);
  }
}

async function handleOrders(message: DiscordMessage, discord: DiscordClient): Promise<void> {
  const channelId = message.channel_id;

  try {
    const orders = await fetchDashboard('/api/orders') as Array<{
      symbol: string; side: string; qty: number;
      type: string; status: string; filled_avg_price?: number;
      created_at: string;
    }>;

    if (!orders || orders.length === 0) {
      await discord.send(channelId, '**Recent Orders:** None found.');
      return;
    }

    let text = `**Recent Orders** (${Math.min(orders.length, 15)})\n\n`;
    text += '```\n';
    text += 'Symbol   Side   Qty   Status     Price      Date\n';
    text += '─'.repeat(60) + '\n';

    for (const o of orders.slice(0, 15)) {
      const sym = o.symbol.padEnd(8);
      const side = o.side.toUpperCase().padEnd(6);
      const qty = String(Number(o.qty)).padStart(4);
      const status = o.status.padEnd(10);
      const price = o.filled_avg_price ? formatCurrency(Number(o.filled_avg_price)).padStart(10) : '       N/A';
      const date = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      text += `${sym} ${side} ${qty} ${status} ${price}  ${date}\n`;
    }

    text += '```';
    await discord.send(channelId, text);
  } catch (error) {
    log(`Orders error: ${error}`);
    await discord.send(channelId, `Failed to fetch orders: ${error}`);
  }
}

function getJosephHelpText(): string {
  return `**Joseph Trading Bot**

**Portfolio:**
\`!positions\` - Open positions with P&L
\`!portfolio\` - Account summary (equity, buying power)
\`!orders\` - Recent orders

**Analysis:**
\`!scan\` - Latest scan recommendations
\`!report\` - Recent daily performance
\`!learnings\` - Active trading learnings

**Other:**
\`!help\` - This help text
*(plain text)* - Chat with Joseph about trading

*All commands are read-only. No trade execution from Discord.*`;
}

// ============================================================================
// Joseph Chat (plain text via OpenAI)
// ============================================================================

const JOSEPH_SYSTEM_PROMPT = `You are Joseph, an AI trading assistant for a paper trading portfolio on Alpaca. You specialize in swing trading using technical momentum and mean reversion strategies.

Key context:
- Portfolio is $100K paper trading account on Alpaca
- Strategy: Buy signals from multi-source scans, hold 3-5 days, stop-loss 3%, take-profit 5%
- You're knowledgeable about market analysis, trading psychology, and risk management
- Be concise and direct. Use trading terminology naturally.
- If asked about specific positions or data, suggest using the ! commands.`;

async function handleJosephChat(
  message: DiscordMessage,
  text: string,
  discord: DiscordClient,
  claude: ClaudeClient | null,
): Promise<void> {
  const channelId = message.channel_id;

  if (!claude) {
    await discord.send(channelId, 'OpenAI API not configured. Chat unavailable.\n\nUse `!help` to see data commands.');
    return;
  }

  try {
    await discord.sendTyping(channelId);
    const response = await claude.chat(channelId, text, 'chat', JOSEPH_SYSTEM_PROMPT);
    await discord.send(channelId, response);
  } catch (error) {
    log(`Joseph chat error: ${error}`);
    await discord.send(channelId, `Chat error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// Main Handler (exported)
// ============================================================================

export async function handleJoseph(
  message: DiscordMessage,
  text: string,
  discord: DiscordClient,
  claude: ClaudeClient | null,
  _state: ConversationState,
): Promise<void> {
  const channelId = message.channel_id;

  // Route commands
  if (text.startsWith('!')) {
    const spaceIndex = text.indexOf(' ');
    const command = spaceIndex > 0 ? text.substring(0, spaceIndex).toLowerCase() : text.toLowerCase();

    await discord.sendTyping(channelId);

    switch (command) {
      case '!positions':
        return handlePositions(message, discord);
      case '!portfolio':
        return handlePortfolio(message, discord);
      case '!scan':
        return handleScan(message, discord);
      case '!report':
        return handleReport(message, discord);
      case '!learnings':
        return handleLearnings(message, discord);
      case '!orders':
        return handleOrders(message, discord);
      case '!help':
        return discord.send(channelId, getJosephHelpText()).then(() => {});
      default:
        await discord.send(channelId, `Unknown command: ${command}\n\nUse \`!help\` to see Joseph commands.`);
        return;
    }
  }

  // Plain text -> Joseph chat
  await handleJosephChat(message, text, discord, claude);
}

export default handleJoseph;
