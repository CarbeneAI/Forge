/**
 * PatternLoader.ts - Load Fabric patterns for PAI Telegram Bot
 *
 * Loads patterns from ~/.claude/skills/Fabric/tools/patterns/
 */

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Configuration
// ============================================================================

const PAI_DIR = process.env.PAI_DIR || join(process.env.HOME!, '.claude');
const PATTERNS_DIR = join(PAI_DIR, 'skills/Fabric/tools/patterns');

// ============================================================================
// Types
// ============================================================================

export interface PatternInfo {
  name: string;
  description: string;
  hasSystem: boolean;
}

// ============================================================================
// PatternLoader Class
// ============================================================================

export class PatternLoader {
  private patternsDir: string;
  private patternCache: Map<string, string> = new Map();

  constructor() {
    this.patternsDir = PATTERNS_DIR;
  }

  /**
   * Get list of all available patterns
   */
  async listPatterns(): Promise<string[]> {
    if (!existsSync(this.patternsDir)) {
      return [];
    }

    try {
      const entries = readdirSync(this.patternsDir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    } catch {
      return [];
    }
  }

  /**
   * Check if a pattern exists
   */
  patternExists(name: string): boolean {
    const systemPath = join(this.patternsDir, name, 'system.md');
    return existsSync(systemPath);
  }

  /**
   * Load a pattern's system prompt
   */
  async loadPattern(name: string): Promise<string | null> {
    // Check cache first
    if (this.patternCache.has(name)) {
      return this.patternCache.get(name)!;
    }

    const systemPath = join(this.patternsDir, name, 'system.md');

    if (!existsSync(systemPath)) {
      return null;
    }

    try {
      const content = await Bun.file(systemPath).text();
      this.patternCache.set(name, content);
      return content;
    } catch {
      return null;
    }
  }

  /**
   * Get pattern info (name + first line of system.md as description)
   */
  async getPatternInfo(name: string): Promise<PatternInfo | null> {
    const systemPath = join(this.patternsDir, name, 'system.md');
    const hasSystem = existsSync(systemPath);

    if (!hasSystem) {
      return null;
    }

    let description = '';
    try {
      const content = await Bun.file(systemPath).text();
      // Get first non-empty, non-comment line as description
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          description = trimmed.substring(0, 100);
          if (trimmed.length > 100) description += '...';
          break;
        }
      }
    } catch {
      description = 'Unable to load description';
    }

    return { name, description, hasSystem };
  }

  /**
   * Search patterns by name
   */
  async searchPatterns(query: string): Promise<string[]> {
    const patterns = await this.listPatterns();
    const lowerQuery = query.toLowerCase();
    return patterns.filter((p) => p.toLowerCase().includes(lowerQuery));
  }

  /**
   * Get popular/common patterns
   */
  getPopularPatterns(): string[] {
    return [
      'extract_wisdom',
      'summarize',
      'analyze_claims',
      'create_summary',
      'explain_code',
      'improve_writing',
      'extract_insights',
      'create_tags',
      'rate_content',
      'analyze_paper',
    ];
  }

  /**
   * Format patterns for Telegram message
   */
  async formatPatternList(patterns: string[], limit: number = 20): Promise<string> {
    const displayPatterns = patterns.slice(0, limit);
    const remaining = patterns.length - limit;

    let message = '*Available Patterns:*\n\n';
    message += displayPatterns.map((p) => `\`${p}\``).join('\n');

    if (remaining > 0) {
      message += `\n\n_...and ${remaining} more patterns_`;
    }

    message += '\n\n_Use `/fabric <pattern>` to apply a pattern._';
    return message;
  }
}

export default PatternLoader;
