#!/usr/bin/env node
/**
 * run-agents.mjs — sweep the .claude/agents/ specialist agents headlessly.
 *
 * Each agent runs as its own `claude -p --agent <name>` session in this repo's
 * working tree, one at a time (shared tree — parallel runs would race the same
 * files and commits). Improvement agents commit one small change per their
 * contract; review agents (engine-reviewer, combat-engine-reviewer,
 * perf-auditor) report to stdout, which is captured to the per-agent log.
 *
 * Usage:
 *   bun scripts/run-agents.mjs [options]
 *   node scripts/run-agents.mjs [options]
 *
 * Options:
 *   --only <a,b>            run only these agents
 *   --skip <a,b>            skip these agents
 *   --resume-from <name>    start at this agent (runs are alphabetical)
 *   --limit <n>             run at most n agents
 *   --timeout-min <n>       per-agent wall-clock limit in minutes (default 25)
 *   --model <m>             pass through to `claude --model`
 *   --max-budget <usd>      pass through to `claude --max-budget-usd` (per agent)
 *   --permission-mode <m>   default bypassPermissions
 *   --dispatch              dispatch via "use the <name> subagent" prompt
 *                           instead of `--agent <name>` (fallback if the CLI
 *                           build doesn't resolve project agent names)
 *   --allow-dirty           don't require a clean worktree before starting
 *   --ignore-auth           skip the `claude auth status` preflight
 *   --dry-run               print the run plan without executing
 *
 * Output: archives/agent-runs/<timestamp>/<agent>.log + SUMMARY.md
 * (archives/ is gitignored — see AGENTS.md docs taxonomy).
 *
 * After each run the runner stashes uncommitted leftovers (labelled
 * "agent-runner: <name> leftovers") so one agent's debris can't be swept into
 * the next agent's commit. Review stashes with `git stash list`.
 */

import { execSync, spawn } from 'node:child_process';
import { createWriteStream, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = process.cwd();
const AGENTS_DIR = join(REPO, '.claude', 'agents');

// ---------------------------------------------------------------- args
function parseArgs(argv) {
  const o = {
    only: null,
    skip: new Set(),
    resumeFrom: null,
    limit: Infinity,
    timeoutMin: 25,
    model: null,
    maxBudget: null,
    permissionMode: 'bypassPermissions',
    dispatch: false,
    allowDirty: false,
    ignoreAuth: false,
    dryRun: false,
  };
  const take = (i) => {
    if (i + 1 >= argv.length) fail(`missing value for ${argv[i]}`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--only':
        o.only = new Set(
          take(i)
            .split(',')
            .map((s) => s.trim())
        );
        i++;
        break;
      case '--skip':
        take(i)
          .split(',')
          .forEach((s) => o.skip.add(s.trim()));
        i++;
        break;
      case '--resume-from':
        o.resumeFrom = take(i);
        i++;
        break;
      case '--limit':
        o.limit = Number(take(i));
        i++;
        break;
      case '--timeout-min':
        o.timeoutMin = Number(take(i));
        i++;
        break;
      case '--model':
        o.model = take(i);
        i++;
        break;
      case '--max-budget':
        o.maxBudget = take(i);
        i++;
        break;
      case '--permission-mode':
        o.permissionMode = take(i);
        i++;
        break;
      case '--dispatch':
        o.dispatch = true;
        break;
      case '--allow-dirty':
        o.allowDirty = true;
        break;
      case '--ignore-auth':
        o.ignoreAuth = true;
        break;
      case '--dry-run':
        o.dryRun = true;
        break;
      case '-h':
      case '--help':
        execSync(`sed -n '3,40p' ${join(REPO, 'scripts', 'run-agents.mjs')}`, { stdio: 'inherit' });
        process.exit(0);
      default:
        fail(`unknown option ${a}`);
    }
  }
  return o;
}

function fail(msg) {
  console.error(`run-agents: ${msg}`);
  process.exit(1);
}

const sh = (cmd) => execSync(cmd, { cwd: REPO, encoding: 'utf8' }).trim();
const shOk = (cmd) => {
  try {
    return sh(cmd);
  } catch {
    return null;
  }
};

// ------------------------------------------------------------ discovery
function discoverAgents() {
  const agents = [];
  for (const f of readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()) {
    const text = readFileSync(join(AGENTS_DIR, f), 'utf8');
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const name = fm?.[1].match(/^name:\s*(\S+)\s*$/m)?.[1] ?? f.replace(/\.md$/, '');
    const desc = fm?.[1].match(/^description:\s*(.+)$/m)?.[1] ?? '';
    agents.push({ name, file: f, desc });
  }
  return agents;
}

// ------------------------------------------------------------ preflight
function preflight(opts) {
  if (!shOk('command -v claude')) fail('`claude` CLI not on PATH');
  if (!opts.ignoreAuth) {
    const raw = shOk('claude auth status') ?? '';
    try {
      if (!JSON.parse(raw).loggedIn) {
        fail(
          'claude CLI is not authenticated — run `claude auth login` (or set ANTHROPIC_API_KEY) and retry, or pass --ignore-auth'
        );
      }
    } catch (e) {
      if (e instanceof SyntaxError) fail('`claude auth status` returned unparseable output');
      throw e;
    }
  }
  if (!opts.allowDirty && sh('git status --porcelain')) {
    fail(
      'working tree is dirty — commit or stash first (agents commit to the current branch; leftovers would interleave). --allow-dirty overrides'
    );
  }
  if (!shOk('git rev-parse --abbrev-ref HEAD')) fail('not in a git repository');
}

// ----------------------------------------------------------------- run
function buildPrompt(name, dispatch) {
  const mission =
    `Perform your mission exactly as your agent instructions define — ` +
    `one small, verified improvement, or a review report if that is your role. ` +
    `Work only inside this repository. If your role ships a change: run the ` +
    `checks your instructions specify, then \`git add\` and \`git commit\` to ` +
    `the current branch with a conventional-commit title. Append durable ` +
    `learnings to .claude/agent-journals/${name}.md (create it if needed; ` +
    `follow .claude/agent-journals/README.md). If nothing safe is worth ` +
    `doing, change nothing and say so plainly. Never push, never force-push, ` +
    `never rewrite history, never touch remotes.`;
  return dispatch ? `Use the ${name} subagent for this task: ${mission}` : mission;
}

function runAgent(agent, opts, logPath) {
  const args = ['-p', '--output-format', 'text', '--permission-mode', opts.permissionMode];
  if (opts.model) args.push('--model', opts.model);
  if (opts.maxBudget) args.push('--max-budget-usd', String(opts.maxBudget));
  if (!opts.dispatch) args.push('--agent', agent.name);
  args.push(buildPrompt(agent.name, opts.dispatch));

  const log = createWriteStream(logPath);
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn('claude', args, { cwd: REPO, env: process.env });
    const killer = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 10_000).unref();
    }, opts.timeoutMin * 60_000);
    killer.unref();
    child.stdout.on('data', (d) => {
      log.write(d);
      process.stdout.write(d);
    });
    child.stderr.on('data', (d) => {
      log.write(d);
      process.stderr.write(d);
    });
    child.on('error', (e) => {
      log.end(`spawn error: ${e.message}`);
      clearTimeout(killer);
      resolve({ exit: -1, timedOut: false, ms: Date.now() - started });
    });
    child.on('close', (code, signal) => {
      clearTimeout(killer);
      log.end();
      resolve({
        exit: code ?? -1,
        timedOut: signal === 'SIGTERM' || signal === 'SIGKILL',
        ms: Date.now() - started,
      });
    });
  });
}

// ---------------------------------------------------------------- main
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  let agents = discoverAgents();
  if (opts.only) agents = agents.filter((a) => opts.only.has(a.name));
  if (opts.skip.size) agents = agents.filter((a) => !opts.skip.has(a.name));
  if (opts.resumeFrom) {
    const idx = agents.findIndex((a) => a.name === opts.resumeFrom);
    if (idx === -1) fail(`--resume-from: no agent named ${opts.resumeFrom}`);
    agents = agents.slice(idx);
  }
  agents = agents.slice(0, opts.limit === Infinity ? agents.length : opts.limit);
  if (!agents.length) fail('no agents selected');

  console.log(`\nrun-agents: ${agents.length} agent(s) queued`);
  for (const a of agents) console.log(`  - ${a.name}`);
  if (opts.dryRun) {
    console.log('\n(dry run — nothing executed)');
    return;
  }

  preflight(opts);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const runDir = join(REPO, 'archives', 'agent-runs', stamp);
  mkdirSync(runDir, { recursive: true });
  const startSha = sh('git rev-parse HEAD');
  console.log(`logs → ${runDir}\nstart commit ${startSha.slice(0, 9)}\n`);

  const results = [];
  for (const agent of agents) {
    const before = sh('git rev-parse HEAD');
    console.log(`\n=== [${agent.name}] starting ${new Date().toISOString()} ===`);
    const logPath = join(runDir, `${agent.name}.log`);
    const r = await runAgent(agent, opts, logPath);
    const after = sh('git rev-parse HEAD');
    const commits = before === after ? [] : sh(`git log --oneline ${before}..${after}`).split('\n');
    let leftover = false;
    if (sh('git status --porcelain')) {
      leftover = true;
      sh(`git stash push -u -m "agent-runner: ${agent.name} leftovers"`);
      console.log(`  (stashed uncommitted leftovers from ${agent.name})`);
    }
    results.push({ agent: agent.name, ...r, commits, leftover });
    const dur = (r.ms / 60_000).toFixed(1);
    console.log(
      `=== [${agent.name}] exit=${r.exit}${r.timedOut ? ' (timeout)' : ''} dur=${dur}m commits=${commits.length}${leftover ? ' +leftover-stash' : ''} ===`
    );
  }

  // ------------------------------------------------------------- summary
  const lines = [
    '# Agent run summary',
    '',
    `start: ${startSha}`,
    `end:   ${sh('git rev-parse HEAD')}`,
    `dir:   ${runDir}`,
    '',
    '| agent | exit | time | commits | notes |',
    '|---|---|---|---|---|',
  ];
  for (const r of results) {
    const notes = [r.timedOut ? 'TIMEOUT' : null, r.leftover ? 'leftover stash' : null]
      .filter(Boolean)
      .join(', ');
    lines.push(
      `| ${r.agent} | ${r.exit} | ${(r.ms / 60_000).toFixed(1)}m | ${r.commits.length} | ${notes} |`
    );
  }
  lines.push('', '## commits', '');
  const allCommits = sh(`git log --oneline ${startSha}..HEAD`);
  lines.push(allCommits || '(none)');
  writeFileSync(join(runDir, 'SUMMARY.md'), lines.join('\n') + '\n');

  console.log('\n' + lines.slice(5).join('\n'));
  const failed = results.filter((r) => r.exit !== 0);
  if (failed.length)
    console.log(`\n${failed.length} agent(s) exited non-zero — see logs in ${runDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
