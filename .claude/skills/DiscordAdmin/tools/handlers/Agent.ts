/**
 * Agent.ts - PAI Agent invocation handler for Discord Bot
 *
 * Uses API clients directly. Research agents use Perplexity,
 * other agents use OpenAI with agent-specific system prompts.
 */

import { DiscordClient, DiscordMessage } from '../lib/DiscordClient';
import { ClaudeClient } from '../../../TelegramBot/tools/lib/ClaudeClient';
import { PerplexityClient } from '../../../TelegramBot/tools/lib/PerplexityClient';
import { ConversationState } from '../../../TelegramBot/tools/lib/ConversationState';
import { ObsidianWriter } from '../../../TelegramBot/tools/lib/ObsidianWriter';

const writer = new ObsidianWriter();

const DISCORD_MAX_LENGTH = 1800;

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [Discord/Agent] ${message}`);
}

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
    systemPrompt: `You are Grok, an elite research synthesizer. Analyze research results, extract key insights, identify patterns, and generate content ideas including blog posts, training materials, and YouTube videos. Format with clear sections.`,
  },
  'architect': {
    description: 'System design & PRDs',
    category: 'design',
    systemPrompt: `You are a senior software architect. Create comprehensive technical designs including system architecture, component breakdown, API specs, technology recommendations, and implementation phases.`,
  },
  'engineer': {
    description: 'Code implementation with TDD',
    category: 'code',
    systemPrompt: `You are a senior software engineer following TDD practices. Define test cases first, then implement production-ready solutions with proper error handling, type safety, and security. Use TypeScript unless specified otherwise.`,
  },
  'designer': {
    description: 'UX/UI design',
    category: 'design',
    systemPrompt: `You are a senior UX/UI designer. Provide user flow analysis, wireframe descriptions, component specs, accessibility considerations, and design system recommendations.`,
  },
  'pentester': {
    description: 'Security testing & vulnerability assessment',
    category: 'security',
    systemPrompt: `You are a senior penetration tester. Analyze for OWASP Top 10, auth issues, input validation, injection risks, and misconfigurations. Provide severity ratings and remediation steps.`,
  },
  'researcher': {
    description: 'General research & information gathering',
    category: 'research',
    usePerplexity: true,
    systemPrompt: `You are a thorough researcher. Provide comprehensive analysis with key facts, multiple perspectives, source assessment, and actionable conclusions.`,
  },
  'claude-researcher': {
    description: 'Web search research via Claude',
    category: 'research',
    usePerplexity: true,
    systemPrompt: `You are a research assistant. Provide well-sourced research with current information, key findings, important context, and reliable sources.`,
  },
  'perplexity-researcher': {
    description: 'Deep research with citations',
    category: 'research',
    usePerplexity: true,
    systemPrompt: `Provide academic-quality research with comprehensive coverage, source citations, multiple viewpoints, and critical analysis.`,
  },
  'gemini-researcher': {
    description: 'Multi-perspective research',
    category: 'research',
    usePerplexity: true,
    systemPrompt: `Provide multi-perspective research with technical depth, different viewpoints, emerging trends, and practical applications.`,
  },
};

function truncateForDiscord(content: string): { truncated: string; wasTruncated: boolean } {
  if (content.length <= DISCORD_MAX_LENGTH) {
    return { truncated: content, wasTruncated: false };
  }

  let breakPoint = DISCORD_MAX_LENGTH - 100;
  const paragraphBreak = content.lastIndexOf('\n\n', breakPoint);
  if (paragraphBreak > DISCORD_MAX_LENGTH * 0.5) {
    breakPoint = paragraphBreak;
  } else {
    const sentenceBreak = content.lastIndexOf('. ', breakPoint);
    if (sentenceBreak > DISCORD_MAX_LENGTH * 0.5) {
      breakPoint = sentenceBreak + 1;
    }
  }

  return {
    truncated: content.substring(0, breakPoint) + '\n\n---\n*Content truncated. Full version saved to Obsidian.*',
    wasTruncated: true,
  };
}

function formatAgentList(): string {
  let list = '**Available Agents:**\n\n';
  for (const [name, info] of Object.entries(AGENTS)) {
    list += `- \`${name}\` - ${info.description}\n`;
  }
  return list;
}

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

export async function handleAgent(
  message: DiscordMessage,
  args: string,
  discord: DiscordClient,
  state: ConversationState
): Promise<void> {
  const channelId = message.channel_id;
  const input = args.trim();

  if (!input) {
    const help = `**PAI Agent Invocation**\n\nUsage: \`!agent <name> <task>\`\n\n${formatAgentList()}\n**Examples:**\n- \`!agent grok-researcher AI agents in cybersecurity\`\n- \`!agent architect Design a user auth system\`\n- \`!agent pentester Review our API security\`\n\n*Results auto-save to Obsidian.*`;
    await discord.send(channelId, help);
    return;
  }

  const firstSpace = input.indexOf(' ');
  if (firstSpace === -1) {
    await discord.send(channelId, `Please provide a task.\n\nUsage: \`!agent ${input} <your task here>\``);
    return;
  }

  const agentName = input.substring(0, firstSpace).toLowerCase();
  const task = input.substring(firstSpace + 1).trim();

  const agent = AGENTS[agentName];
  if (!agent) {
    await discord.send(channelId, `Unknown agent: \`${agentName}\`\n\n${formatAgentList()}`);
    return;
  }

  if (!task) {
    await discord.send(channelId, `Please provide a task for the ${agentName} agent.`);
    return;
  }

  try {
    await discord.sendTyping(channelId);
    await discord.send(channelId, `**Invoking ${agentName} agent...**\n\n*${agent.description}*\n\nTask: ${task.substring(0, 100)}${task.length > 100 ? '...' : ''}\n\n*Working... this may take a minute.*`);

    log(`Starting agent: ${agentName} for task: ${task}`);

    let result: string;
    let citations: string[] = [];

    if (agent.usePerplexity) {
      log(`Using Perplexity for ${agentName}`);
      let perplexity: PerplexityClient;
      try {
        perplexity = new PerplexityClient();
      } catch {
        await discord.send(channelId, 'Perplexity API not configured.');
        return;
      }

      await discord.sendTyping(channelId);
      const researchQuery = `${agent.systemPrompt}\n\nResearch task: ${task}`;
      const perplexityResult = await perplexity.research(researchQuery, 'deep');
      result = perplexityResult.content;
      citations = perplexityResult.citations;

      if (agentName === 'grok-researcher') {
        await discord.sendTyping(channelId);
        await discord.send(channelId, '*Generating content ideas...*');
        try {
          const openai = new ClaudeClient();
          const ideation = await openai.chat(channelId, `Based on this research, generate content ideas:\n\n${result.substring(0, 8000)}\n\nGenerate blog posts, training materials, and YouTube video ideas.`, 'ideation');
          result += '\n\n---\n\n## Content Ideas\n\n' + ideation;
        } catch {
          log('OpenAI not available for content ideation');
        }
      }
    } else {
      log(`Using OpenAI for ${agentName}`);
      let openai: ClaudeClient;
      try {
        openai = new ClaudeClient();
      } catch {
        await discord.send(channelId, 'OpenAI API not configured.');
        return;
      }

      await discord.sendTyping(channelId);
      result = await openai.chat(channelId, `${agent.systemPrompt}\n\n---\n\nTask: ${task}`, agentName);
    }

    // Build full content for saving
    let fullContent = `# Agent: ${agentName}\n\n**Task:** ${task}\n**Generated:** ${new Date().toISOString().split('T')[0]}\n\n---\n\n${result}`;
    if (citations.length > 0) fullContent += formatCitations(citations);

    const topicSlug = task.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const saveResult = await writer.save(fullContent, {
      type: 'agent' as 'chat',
      userQuery: task,
      topic: `${agentName}-${topicSlug}`,
      tags: ['agent', 'discord', agentName, agent.category],
    });

    state.saveResponse(channelId, fullContent, 'chat', task);

    const { truncated, wasTruncated } = truncateForDiscord(result);
    await discord.send(channelId, truncated);

    const filename = saveResult.filePath?.split('/').pop() || 'unknown';
    let finalStatus = `\n**${agentName} agent complete!**`;
    if (saveResult.success) finalStatus += `\n\nSaved: \`${filename}\``;
    if (wasTruncated) finalStatus += `\n*Full content (${fullContent.length} chars) saved to Obsidian.*`;
    await discord.send(channelId, finalStatus);

    log('Agent handler complete');
  } catch (error) {
    log(`Agent error: ${error}`);
    await discord.send(channelId, `Agent failed: ${error}\n\nTry again or use a different agent.`);
  }
}

export default handleAgent;
