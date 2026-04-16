/**
 * Agent.ts - PAI Agent invocation handler for Telegram Bot
 *
 * Uses API clients directly instead of spawning Claude CLI for reliability.
 * Research agents use Perplexity, other agents use OpenAI with agent prompts.
 */

import { TelegramClient, TelegramMessage } from '../lib/TelegramClient';
import { ClaudeClient } from '../lib/ClaudeClient';
import { PerplexityClient } from '../lib/PerplexityClient';
import { ConversationState } from '../lib/ConversationState';
import { ObsidianWriter } from '../lib/ObsidianWriter';

const writer = new ObsidianWriter();

// Logging helper
function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [Agent] ${message}`);
}

// Telegram message limit
const TELEGRAM_MAX_LENGTH = 4000;

// Agent definitions with system prompts
const AGENTS: Record<string, {
  description: string;
  category: string;
  systemPrompt: string;
  usePerplexity?: boolean;
}> = {
  'grok-researcher': {
    description: 'Research synthesis & content ideation',
    category: 'research',
    usePerplexity: true,
    systemPrompt: `You are Grok, an elite research synthesizer. Your role is to:
1. Analyze research results comprehensively
2. Extract key insights and patterns
3. Identify contradictions or gaps
4. Generate content ideas including:
   - 3-5 blog post ideas with titles and key points
   - 2-3 training material concepts
   - 3-5 YouTube video ideas with hooks

Format your response with clear sections:
## Key Insights
## Patterns & Trends
## Content Ideas
### Blog Posts
### Training Materials
### YouTube Videos
## Recommended Next Steps`,
  },
  'architect': {
    description: 'System design & PRDs',
    category: 'design',
    systemPrompt: `You are a senior software architect. Create comprehensive technical designs including:
- System architecture overview
- Component breakdown
- Data flow diagrams (described)
- API specifications
- Technology recommendations
- Implementation phases
- Risk assessment

Be thorough but practical. Focus on scalability, maintainability, and security.`,
  },
  'engineer': {
    description: 'Code implementation with TDD',
    category: 'code',
    systemPrompt: `You are a senior software engineer following TDD practices. For any task:
1. First define test cases
2. Then implement the solution
3. Ensure code is production-ready with:
   - Proper error handling
   - Type safety
   - Documentation
   - Security best practices

Use TypeScript unless another language is specified.`,
  },
  'designer': {
    description: 'UX/UI design',
    category: 'design',
    systemPrompt: `You are a senior UX/UI designer. Provide:
- User flow analysis
- Wireframe descriptions
- Component specifications
- Accessibility considerations
- Design system recommendations
- Interaction patterns

Focus on user-centered design and modern best practices.`,
  },
  'pentester': {
    description: 'Security testing & vulnerability assessment',
    category: 'security',
    systemPrompt: `You are a senior penetration tester and security analyst. Analyze for:
- OWASP Top 10 vulnerabilities
- Authentication/authorization issues
- Input validation problems
- Injection risks
- Security misconfigurations
- Sensitive data exposure

Provide specific findings with severity ratings and remediation steps.`,
  },
  'researcher': {
    description: 'General research & information gathering',
    category: 'research',
    usePerplexity: true,
    systemPrompt: `You are a thorough researcher. Provide comprehensive analysis including:
- Key facts and findings
- Multiple perspectives
- Source credibility assessment
- Knowledge gaps identified
- Actionable conclusions`,
  },
  'claude-researcher': {
    description: 'Web search research via Claude',
    category: 'research',
    usePerplexity: true,
    systemPrompt: `You are a research assistant. Provide well-sourced research with:
- Current information
- Key findings summarized
- Important context
- Reliable sources noted`,
  },
  'perplexity-researcher': {
    description: 'Deep research with citations',
    category: 'research',
    usePerplexity: true,
    systemPrompt: `Provide academic-quality research with:
- Comprehensive coverage
- Source citations
- Multiple viewpoints
- Critical analysis`,
  },
  'gemini-researcher': {
    description: 'Multi-perspective research',
    category: 'research',
    usePerplexity: true,
    systemPrompt: `Provide multi-perspective research including:
- Technical depth
- Different viewpoints
- Emerging trends
- Practical applications`,
  },
};

/**
 * Truncate content for Telegram
 */
function truncateForTelegram(content: string): { truncated: string; wasTruncated: boolean } {
  if (content.length <= TELEGRAM_MAX_LENGTH) {
    return { truncated: content, wasTruncated: false };
  }

  let breakPoint = TELEGRAM_MAX_LENGTH - 100;
  const paragraphBreak = content.lastIndexOf('\n\n', breakPoint);
  if (paragraphBreak > TELEGRAM_MAX_LENGTH * 0.5) {
    breakPoint = paragraphBreak;
  } else {
    const sentenceBreak = content.lastIndexOf('. ', breakPoint);
    if (sentenceBreak > TELEGRAM_MAX_LENGTH * 0.5) {
      breakPoint = sentenceBreak + 1;
    }
  }

  const truncated = content.substring(0, breakPoint) +
    '\n\n---\n_Content truncated. Full version saved to Obsidian._';

  return { truncated, wasTruncated: true };
}

/**
 * Format agent list for help message
 */
function formatAgentList(): string {
  let list = '*Available Agents:*\n\n';
  for (const [name, info] of Object.entries(AGENTS)) {
    list += `• \`${name}\` - ${info.description}\n`;
  }
  return list;
}

/**
 * Format citations
 */
function formatCitations(citations: string[]): string {
  if (!citations || citations.length === 0) return '';
  let formatted = '\n\n## Sources\n\n';
  citations.forEach((url, i) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      formatted += `${i + 1}. [${domain}](${url})\n`;
    } catch {
      formatted += `${i + 1}. ${url}\n`;
    }
  });
  return formatted;
}

/**
 * Main handler
 */
export async function handleAgent(
  message: TelegramMessage,
  args: string,
  telegram: TelegramClient,
  state: ConversationState
): Promise<void> {
  const chatId = message.chat.id;
  const input = args.trim();

  // Show help if no args
  if (!input) {
    const help = `*PAI Agent Invocation*

Usage: \`/agent <name> <task>\`

${formatAgentList()}
*Examples:*
• \`/agent grok-researcher AI agents in cybersecurity\`
• \`/agent architect Design a user auth system\`
• \`/agent engineer Implement JWT auth in TypeScript\`
• \`/agent pentester Review our API security\`

_Results auto-save to Obsidian._`;

    await telegram.send(chatId, help);
    return;
  }

  // Parse agent name and task
  const firstSpace = input.indexOf(' ');
  if (firstSpace === -1) {
    await telegram.send(
      chatId,
      `Please provide a task for the agent.\n\nUsage: \`/agent ${input} <your task here>\``
    );
    return;
  }

  const agentName = input.substring(0, firstSpace).toLowerCase();
  const task = input.substring(firstSpace + 1).trim();

  // Validate agent exists
  const agent = AGENTS[agentName];
  if (!agent) {
    await telegram.send(
      chatId,
      `Unknown agent: \`${agentName}\`\n\n${formatAgentList()}\nUse one of the agents listed above.`
    );
    return;
  }

  if (!task) {
    await telegram.send(
      chatId,
      `Please provide a task for the ${agentName} agent.\n\nExample: \`/agent ${agentName} your task here\``
    );
    return;
  }

  try {
    await telegram.sendTyping(chatId);
    await telegram.send(
      chatId,
      `*Invoking ${agentName} agent...*\n\n_${agent.description}_\n\nTask: ${task.substring(0, 100)}${task.length > 100 ? '...' : ''}\n\n_Working... this may take a minute._`
    );

    log(`Starting agent: ${agentName} for task: ${task}`);

    let result: string;
    let citations: string[] = [];

    // Use appropriate API based on agent type
    if (agent.usePerplexity) {
      // Research agents use Perplexity
      log(`Using Perplexity for ${agentName}`);

      let perplexity: PerplexityClient;
      try {
        perplexity = new PerplexityClient();
      } catch (error) {
        await telegram.send(chatId, 'Perplexity API not configured. Add PERPLEXITY_API_KEY to ~/.claude/.env');
        return;
      }

      await telegram.sendTyping(chatId);

      // Build research query with agent context
      const researchQuery = `${agent.systemPrompt}\n\nResearch task: ${task}`;
      const perplexityResult = await perplexity.research(researchQuery, 'deep');

      result = perplexityResult.content;
      citations = perplexityResult.citations;

      log(`Perplexity returned ${result.length} chars`);

      // For grok-researcher, add content ideation
      if (agentName === 'grok-researcher') {
        await telegram.sendTyping(chatId);
        await telegram.send(chatId, `_Generating content ideas..._`);

        // Use OpenAI for content ideation based on research
        let openai: ClaudeClient;
        try {
          openai = new ClaudeClient();
        } catch {
          // Continue without content ideation if OpenAI not available
          log('OpenAI not available for content ideation');
        }

        if (openai!) {
          const ideationPrompt = `Based on this research, generate content ideas:

${result.substring(0, 8000)}

Generate:
1. 3-5 Blog Post Ideas (with titles and 3 key points each)
2. 2-3 Training Material Ideas (workshop/course concepts)
3. 3-5 YouTube Video Ideas (with hooks/angles)

Format clearly with headers.`;

          const ideation = await openai.chat(String(chatId), ideationPrompt, 'ideation');
          result += '\n\n---\n\n## Content Ideas\n\n' + ideation;
        }
      }
    } else {
      // Non-research agents use OpenAI with agent system prompt
      log(`Using OpenAI for ${agentName}`);

      let openai: ClaudeClient;
      try {
        openai = new ClaudeClient();
      } catch (error) {
        await telegram.send(chatId, 'OpenAI API not configured. Add OPENAI_API_KEY to ~/.claude/.env');
        return;
      }

      await telegram.sendTyping(chatId);

      // Use agent's system prompt
      const fullPrompt = `${agent.systemPrompt}\n\n---\n\nTask: ${task}`;
      result = await openai.chat(String(chatId), fullPrompt, agentName);

      log(`OpenAI returned ${result.length} chars`);
    }

    // Build full content for saving
    const timestamp = new Date().toISOString().split('T')[0];
    let fullContent = `# Agent: ${agentName}\n\n`;
    fullContent += `**Task:** ${task}\n`;
    fullContent += `**Generated:** ${timestamp}\n\n`;
    fullContent += `---\n\n`;
    fullContent += result;
    if (citations.length > 0) {
      fullContent += formatCitations(citations);
    }

    log(`Full content: ${fullContent.length} chars`);

    // Save to Obsidian
    const topicSlug = task.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const saveResult = await writer.save(fullContent, {
      type: 'agent',
      userQuery: task,
      topic: `${agentName}-${topicSlug}`,
      tags: ['agent', agentName, agent.category],
    });

    if (saveResult.success) {
      log(`Saved to: ${saveResult.filePath}`);
    } else {
      log(`Failed to save: ${saveResult.error}`);
    }

    // Save to state
    state.saveResponse(String(chatId), fullContent, 'agent', task, { agent: agentName });

    // Send to Telegram
    const { truncated, wasTruncated } = truncateForTelegram(result);

    // Split if still too long
    if (truncated.length > 4000) {
      const chunks = [];
      for (let i = 0; i < truncated.length; i += 4000) {
        chunks.push(truncated.substring(i, i + 4000));
      }
      for (const chunk of chunks) {
        await telegram.send(chatId, chunk);
        await telegram.sendTyping(chatId);
      }
    } else {
      await telegram.send(chatId, truncated);
    }

    // Send completion status
    const filename = saveResult.filePath?.split('/').pop() || 'unknown';
    let finalStatus = `\n✅ *${agentName} agent complete!*`;
    if (saveResult.success) {
      finalStatus += `\n\n📁 Saved: \`${filename}\``;
      finalStatus += `\n📂 Location: \`~/Nextcloud/PAI/telegram-saves/\``;
    }
    if (wasTruncated) {
      finalStatus += `\n\n_Full content (${fullContent.length} chars) saved to Obsidian._`;
    }
    await telegram.send(chatId, finalStatus);

    log('Agent handler complete');
  } catch (error) {
    log(`Agent error: ${error}`);
    console.error('Agent error:', error);
    await telegram.send(
      chatId,
      `❌ Agent failed: ${error}\n\nTry again or use a different agent.`
    );
  }
}

export default handleAgent;
