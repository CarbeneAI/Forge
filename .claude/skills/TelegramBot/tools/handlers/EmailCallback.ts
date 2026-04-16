/**
 * EmailCallback.ts - Handle email notification button callbacks
 *
 * Processes inline keyboard button presses from EmailMonitor notifications:
 * - block_email:<email> - Add email to blacklist
 * - block_domain:<domain> - Add domain to blacklist
 * - vip_email:<email> - Add email to VIP list
 * - whitelist_domain:<domain> - Add domain to whitelist
 */

import * as fs from 'fs';
import * as path from 'path';
import { TelegramClient, TelegramCallbackQuery } from '../lib/TelegramClient';

const PAI_DIR = process.env.PAI_DIR || path.join(process.env.HOME!, '.claude');
const CONFIG_FILE = path.join(PAI_DIR, 'skills', 'EmailManager', 'data', 'email-config.json');

interface EmailConfig {
  version: number;
  lastUpdated: string;
  thresholds: {
    spam: number;
    suspicious: number;
    notifyBelow: number;
  };
  vipSenders: {
    emails: string[];
    domains: string[];
  };
  whitelist: {
    emails: string[];
    domains: string[];
    subjectPatterns: string[];
  };
  blacklist: {
    emails: string[];
    domains: string[];
    subjectPatterns: string[];
  };
  [key: string]: unknown;
}

function loadConfig(): EmailConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    throw new Error('Email config not found. Run EmailMonitor first.');
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

function saveConfig(config: EmailConfig): void {
  config.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function addToList(list: string[], item: string): boolean {
  const normalized = item.toLowerCase();
  if (list.map((i) => i.toLowerCase()).includes(normalized)) {
    return false; // Already exists
  }
  list.push(item);
  return true;
}

export async function handleEmailCallback(
  callback: TelegramCallbackQuery,
  telegram: TelegramClient
): Promise<void> {
  const data = callback.data || '';
  const [action, value] = data.split(':');

  if (!value) {
    await telegram.answerCallbackQuery(callback.id, 'Invalid callback data', true);
    return;
  }

  let config: EmailConfig;
  try {
    config = loadConfig();
  } catch (error) {
    await telegram.answerCallbackQuery(callback.id, 'Email config not found', true);
    return;
  }

  let responseText = '';
  let changed = false;

  switch (action) {
    case 'block_email':
      if (addToList(config.blacklist.emails, value)) {
        responseText = `Blocked email: ${value}`;
        changed = true;
      } else {
        responseText = `Already blocked: ${value}`;
      }
      break;

    case 'block_domain':
      if (addToList(config.blacklist.domains, value)) {
        responseText = `Blocked domain: ${value}`;
        changed = true;
      } else {
        responseText = `Already blocked: ${value}`;
      }
      break;

    case 'vip_email':
      if (addToList(config.vipSenders.emails, value)) {
        responseText = `Added VIP: ${value}`;
        changed = true;
      } else {
        responseText = `Already VIP: ${value}`;
      }
      break;

    case 'whitelist_domain':
      if (addToList(config.whitelist.domains, value)) {
        responseText = `Whitelisted: ${value}`;
        changed = true;
      } else {
        responseText = `Already whitelisted: ${value}`;
      }
      break;

    default:
      responseText = `Unknown action: ${action}`;
  }

  if (changed) {
    saveConfig(config);
  }

  await telegram.answerCallbackQuery(callback.id, responseText, true);
}
