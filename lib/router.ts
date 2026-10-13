import { json } from './ai';
import { COMMANDS, detectKind } from './commands';

/*
 * The Command Centre's "chief": reads one plain instruction and hands it to
 * the right team member. Content jobs go to a format; strategy questions go
 * to the Strategist; idea hunting goes to Research.
 */

export type Lane = 'strategist' | 'research' | 'content' | 'brain';
export type Route = { lane: Lane; command: string; reason: string };

const CONTENT_CMDS = COMMANDS.map((c) => c.cmd);

export async function routeInstruction(input: string): Promise<Route> {
  const text = input.trim();
  const { command } = detectKind(text);
  if (command) return { lane: 'content', command, reason: `You chose ${command}.` };

  const r = await json<{ lane: string; command?: string; reason?: string }>(
    `You route one instruction from a founder to their marketing team. Reply with JSON only.
Lanes:
- "content": they want a piece made (post, carousel, image, reel, video script, newsletter, lead magnet / freebie / guide).
- "strategist": they want a marketing decision, plan, positioning, offer, funnel or "what should I do/post" advice.
- "research": they want angles, ideas, hooks, objections, questions their audience asks, topics, content gaps.
- "brain": a plain question about their own business notes (who is my ICP, what is my offer, what did I say about X).
For "content" also pick the format: one of ${CONTENT_CMDS.join(', ')}. Default to /text if they just say "a post".
Return {"lane": string, "command": string or "", "reason": one short sentence in plain English}.`,
    text,
    0,
  );
  const lane = (['strategist', 'research', 'content', 'brain'].includes(r.lane) ? r.lane : 'brain') as Lane;
  const cmd = lane === 'content' ? (CONTENT_CMDS.includes(r.command || '') ? r.command! : '/text') : '';
  return { lane, command: cmd, reason: r.reason || '' };
}
