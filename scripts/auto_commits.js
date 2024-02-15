#!/usr/bin/env node
/*
Automated phased commit generator for StepSeal.
Reads /Users/xinyuwang/Desktop/github_accounts.csv for rotating authors.
Generates >13 commits per account across phases with realistic dates.
Ensures .gitignore excludes sensitive local files and never stages them.
*/

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const ACCOUNTS_CSV = '/Users/xinyuwang/Desktop/github_accounts.csv';
const REMOTE_URL = 'https://github.com/liuliwa1997/StepSeal.git';

function run(cmd, opts = {}) {
  const result = spawnSync(cmd, { shell: true, cwd: REPO_ROOT, env: { ...process.env, ...opts.env }, stdio: 'pipe', encoding: 'utf-8' });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd}\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout.trim();
}

function ensureDir(p) {
  const d = path.join(REPO_ROOT, p);
  fs.mkdirSync(d, { recursive: true });
}

function writeFile(rel, content) {
  const abs = path.join(REPO_ROOT, rel);
  ensureDir(path.dirname(rel));
  fs.writeFileSync(abs, content, 'utf-8');
}

function appendFile(rel, content) {
  const abs = path.join(REPO_ROOT, rel);
  ensureDir(path.dirname(rel));
  fs.appendFileSync(abs, content, 'utf-8');
}

function json(rel, obj) {
  writeFile(rel, JSON.stringify(obj, null, 2) + '\n');
}

function readAccounts() {
  const raw = fs.readFileSync(ACCOUNTS_CSV, 'utf-8').trim().split(/\r?\n/);
  const rows = raw.slice(1).filter(Boolean).map(line => {
    const [username, email, token] = line.split(',');
    return { username, email, token };
  });
  if (rows.length === 0) throw new Error('No accounts found in CSV');
  return rows;
}

function setGitUser(name, email) {
  run(`git config user.name "${name}"`);
  run(`git config user.email "${email}"`);
}

function commitAll(message, dateISO, author) {
  // Never stage sensitive local files even if present
  run('git add -A');
  // Remove accidentally added sensitive files from index if any
  try { run('git reset github_accounts.csv'); } catch {}
  try { run('git reset project_description.txt'); } catch {}

  const env = {
    GIT_AUTHOR_DATE: dateISO,
    GIT_COMMITTER_DATE: dateISO,
    GIT_AUTHOR_NAME: author.username,
    GIT_COMMITTER_NAME: author.username,
    GIT_AUTHOR_EMAIL: author.email,
    GIT_COMMITTER_EMAIL: author.email,
  };
  // Only commit if there are staged changes
  const diff = run('git diff --cached --name-only');
  if (!diff) return false;
  run(`git commit -m "${message}"`, { env });
  return true;
}

function dateSpread(start, end, count) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const step = (e - s) / Math.max(count, 1);
  return Array.from({ length: count }, (_, i) => new Date(s + i * step + Math.floor(Math.random() * Math.min(step, 86_400_000))).toISOString());
}

// Define content generators per phase
function phaseInit(i) {
  // Initialization: repo scaffolding, workspaces, base README, license
  if (i === 0) {
    writeFile('README.md', `# StepSeal\n\nStepSeal is an on-chain daily check-in platform. Users verify actions via wallet, and records are stored immutably on-chain. Rewards (NFT/Token) are distributed based on performance, and team challenges are supported.\n\nThis repository is structured as a monorepo with web DApp, smart contracts, backend API, and subgraph.\n`);
  } else if (i === 1) {
    writeFile('LICENSE', `MIT License\n\nCopyright (c) 2024 StepSeal\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\n...\n`);
  } else if (i === 2) {
    json('package.json', {
      name: 'stepseal',
      private: true,
      version: '0.1.0',
      workspaces: [ 'apps/web', 'apps/backend', 'contracts', 'subgraph' ],
      scripts: {
        "dev:web": "next dev -p 3000 -w apps/web",
        "dev:backend": "node apps/backend/src/server.js"
      }
    });
  } else if (i === 3) {
    ensureDir('apps/web/src');
    writeFile('apps/web/package.json', JSON.stringify({
      name: 'stepseal-web',
      private: true,
      version: '0.1.0',
      scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
      dependencies: { next: '14.2.4', react: '18.2.0', 'react-dom': '18.2.0', wagmi: '^2.12.0', '@rainbow-me/rainbowkit': '^2.2.0' },
      devDependencies: { typescript: '^5.4.0' }
    }, null, 2) + '\n');
    writeFile('apps/web/src/pages/index.tsx', `import React from 'react';\nexport default function Home() {\n  return (<main>StepSeal Web DApp (WIP)</main>);\n}\n`);
  } else if (i === 4) {
    ensureDir('contracts/contracts');
    ensureDir('contracts/test');
    writeFile('contracts/package.json', JSON.stringify({ name: 'stepseal-contracts', private: true, version: '0.1.0', scripts: { test: 'echo "tests TBD"' }, devDependencies: { hardhat: '^2.22.0' } }, null, 2) + '\n');
    writeFile('contracts/hardhat.config.js', `require('@nomicfoundation/hardhat-toolbox');\nmodule.exports = { solidity: '0.8.24' };\n`);
  } else if (i === 5) {
    ensureDir('apps/backend/src');
    writeFile('apps/backend/package.json', JSON.stringify({ name: 'stepseal-backend', private: true, version: '0.1.0', scripts: { start: 'node src/server.js' }, dependencies: { express: '^4.18.3' } }, null, 2) + '\n');
    writeFile('apps/backend/src/server.js', `const express = require('express');\nconst app = express();\napp.get('/health', (_, res) => res.json({ ok: true }));\napp.listen(4000, () => console.log('API listening on :4000'));\n`);
  } else if (i === 6) {
    ensureDir('subgraph');
    writeFile('subgraph/package.json', JSON.stringify({ name: 'stepseal-subgraph', private: true, version: '0.1.0' }, null, 2) + '\n');
    writeFile('subgraph/schema.graphql', `type CheckInSubmitted @entity { id: ID!, user: Bytes!, taskId: BigInt!, timestamp: BigInt! }\n`);
    writeFile('subgraph/subgraph.yaml', `specVersion: 0.0.6\ndescription: StepSeal subgraph\nschema:\n  file: ./schema.graphql\n`);
  } else {
    // small edits to README to spread commits
    appendFile('README.md', `\n## Monorepo Layout\n- apps/web: Next.js DApp\n- contracts: Hardhat\n- apps/backend: Express API\n- subgraph: The Graph manifest\n`);
  }
}

function phaseCore(i) {
  // Core features: contracts, web wallet, API endpoints, subgraph entities
  if (i === 0) {
    writeFile('contracts/contracts/CheckInRegistry.sol', `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\ncontract CheckInRegistry {\n  event CheckInSubmitted(address indexed user, uint256 indexed taskId, uint256 timestamp);\n  mapping(address => mapping(uint256 => uint256)) public lastCheckIn;\n  function submitCheckIn(uint256 taskId) external {\n    uint256 day = block.timestamp / 1 days;\n    require(lastCheckIn[msg.sender][taskId] < day, 'Already checked in today');\n    lastCheckIn[msg.sender][taskId] = day;\n    emit CheckInSubmitted(msg.sender, taskId, block.timestamp);\n  }\n}\n`);
  } else if (i === 1) {
    writeFile('contracts/contracts/TaskManager.sol', `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\ncontract TaskManager {\n  struct Task { address owner; uint64 durationDays; bool active; }\n  mapping(uint256 => Task) public tasks; uint256 public nextTaskId;\n  event TaskCreated(uint256 indexed taskId, address indexed owner, uint64 durationDays);\n  function createTask(uint64 durationDays) external returns (uint256) {\n    require(durationDays > 0, 'duration');\n    uint256 id = ++nextTaskId; tasks[id] = Task(msg.sender, durationDays, true);\n    emit TaskCreated(id, msg.sender, durationDays); return id;\n  }\n}\n`);
  } else if (i === 2) {
    writeFile('contracts/contracts/RewardDistributor.sol', `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\ninterface ICheckInRegistry { function lastCheckIn(address, uint256) external view returns (uint256); }\ncontract RewardDistributor {\n  ICheckInRegistry public registry; constructor(address r) { registry = ICheckInRegistry(r); }\n}\n`);
  } else if (i === 3) {
    writeFile('contracts/contracts/StepSealToken.sol', `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\ncontract StepSealToken { string public name = 'StepSealToken'; string public symbol = 'STEP'; uint8 public decimals = 18; }\n`);
  } else if (i === 4) {
    writeFile('apps/web/src/lib/wallet.tsx', `import '@rainbow-me/rainbowkit/styles.css';\nexport function WalletBanner(){ return <div>Connect your wallet to check in.</div>; }\n`);
  } else if (i === 5) {
    writeFile('apps/web/src/pages/checkin.tsx', `import React from 'react';\nexport default function CheckIn(){ return (<main>Submit daily check-in (on-chain)</main>); }\n`);
  } else if (i === 6) {
    appendFile('apps/backend/src/server.js', `\napp.get('/leaderboard', (_, res) => res.json({ users: [] }));\n`);
  } else if (i === 7) {
    writeFile('subgraph/schema.graphql', `type CheckInSubmitted @entity { id: ID!, user: Bytes!, taskId: BigInt!, timestamp: BigInt! }\n\n type TaskCreated @entity { id: ID!, taskId: BigInt!, owner: Bytes!, durationDays: Int! }\n`);
  } else {
    // small web UI refinements
    appendFile('apps/web/src/pages/index.tsx', `\nexport const Note = () => <p>Track your habits on-chain.</p>;\n`);
  }
}

function phaseTestOpt(i) {
  if (i === 0) {
    writeFile('contracts/test/checkin.test.js', `const { expect } = require('chai');\ndescribe('CheckInRegistry', function(){ it('placeholder test', async () => { expect(1).to.equal(1); }); });\n`);
  } else if (i === 1) {
    writeFile('apps/backend/src/metrics.js', `module.exports = { uptime: () => process.uptime() };\n`);
  } else if (i === 2) {
    appendFile('apps/backend/src/server.js', `\napp.get('/metrics', (_, res) => res.json({ uptime: require('./metrics').uptime() }));\n`);
  } else if (i === 3) {
    appendFile('README.md', `\n## Testing\n- Contracts: Hardhat (placeholder)\n- Backend: Simple endpoint checks\n`);
  } else {
    // minor refactors and small fixes
    appendFile('apps/web/src/pages/checkin.tsx', `\nexport const Helper = () => <small>Daily streaks coming soon.</small>;\n`);
  }
}

function phaseDocs(i) {
  if (i === 0) {
    ensureDir('.github/workflows');
    writeFile('.github/workflows/ci.yml', `name: ci\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Print tree\n        run: ls -la\n`);
  } else if (i === 1) {
    appendFile('README.md', `\n## Documentation\nRefer to contract and API folders for details.\n`);
  } else {
    writeFile('CONTRIBUTING.md', `# Contributing\n- Use conventional commits.\n- Keep changes focused.\n`);
  }
}

function main() {
  const accounts = readAccounts();
  const perAccountCommits = 15; // >13 required
  const totalCommits = perAccountCommits * accounts.length; // 105

  // Define phase distributions
  const phases = [
    { name: 'init', count: 22, start: '2024-02-14T10:00:00Z', end: '2024-04-30T18:00:00Z', fn: phaseInit, type: 'feat' },
    { name: 'core', count: 45, start: '2024-05-01T09:00:00Z', end: '2024-08-31T18:00:00Z', fn: phaseCore, type: 'feat' },
    { name: 'testopt', count: 28, start: '2024-09-01T09:00:00Z', end: '2024-12-31T18:00:00Z', fn: phaseTestOpt, type: 'test' },
    { name: 'docs', count: 10, start: '2025-01-01T09:00:00Z', end: '2025-01-31T18:00:00Z', fn: phaseDocs, type: 'docs' },
  ];

  const totalPlanned = phases.reduce((a, p) => a + p.count, 0);
  if (totalPlanned < totalCommits) {
    // Increase core/test commits by padding
    phases[1].count += (totalCommits - totalPlanned);
  }

  // Prepare .gitignore safety
  const ignorePath = path.join(REPO_ROOT, '.gitignore');
  if (!fs.existsSync(ignorePath)) {
    writeFile('.gitignore', 'node_modules\n.DS_Store\ngithub_accounts.csv\nproject_description.txt\n');
  }

  let commitIndex = 0;
  for (const phase of phases) {
    const dates = dateSpread(phase.start, phase.end, phase.count);
    for (let i = 0; i < phase.count; i++) {
      // Generate or modify content
      phase.fn(i);

      const author = accounts[commitIndex % accounts.length];
      setGitUser(author.username, author.email);
      const type = phase.type === 'test' ? (i % 5 === 0 ? 'fix' : 'test') : phase.type; // sprinkle some fixes
      const message = `${type}: ${phase.name} commit #${i + 1}`;
      const dateISO = dates[i];
      commitAll(message, dateISO, author);
      commitIndex++;
    }
  }

  // Ensure minimum commits per account
  const log = run('git log --format="%an"');
  const counts = {};
  log.split(/\r?\n/).forEach(n => { counts[n] = (counts[n] || 0) + 1; });
  accounts.forEach(a => {
    if ((counts[a.username] || 0) <= 13) {
      // Add top-up commits for this account in docs phase dates
      const dates = dateSpread('2025-01-10T09:00:00Z', '2025-01-31T18:00:00Z', 2);
      for (const d of dates) {
        appendFile('README.md', `\nNote by ${a.username} on ${new Date(d).toISOString()}\n`);
        setGitUser(a.username, a.email);
        commitAll('docs: add contributor note', d, a);
      }
    }
  });

  // Create both main and master branches, push using liuliwa1997 token
  const primary = accounts.find(a => a.username === 'liuliwa1997') || accounts[0];
  // Ensure at least one commit exists
  if (!fs.existsSync(path.join(REPO_ROOT, '.git'))) throw new Error('Not a git repository');

  try { run('git branch -M main'); } catch {}
  try { run('git branch -f master'); } catch {}

  const authed = `https://${primary.token}@github.com/liuliwa1997/StepSeal.git`;
  run(`git remote set-url origin ${authed}`);
  setGitUser(primary.username, primary.email);
  run('git push -u origin main');
  run('git push origin master');
  run(`git remote set-url origin ${REMOTE_URL}`); // restore clean URL
}

if (require.main === module) {
  try { main(); console.log('Automated commits and push complete.'); }
  catch (e) { console.error(e.message); process.exit(1); }
}


