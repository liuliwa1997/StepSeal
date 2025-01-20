# StepSeal

StepSeal is an on-chain daily check-in platform. Users verify actions via wallet, and records are stored immutably on-chain. Rewards (NFT/Token) are distributed based on performance, and team challenges are supported.

This repository is structured as a monorepo with web DApp, smart contracts, backend API, and subgraph.

## Monorepo Layout
- apps/web: Next.js DApp
- contracts: Hardhat
- apps/backend: Express API
- subgraph: The Graph manifest

## Testing
- Contracts: Hardhat (placeholder)
- Backend: Simple endpoint checks

## Documentation
Refer to contract and API folders for details.

## Getting Started
- Install Node.js >= 18 and pnpm or npm
- Install deps: `pnpm install` (or `npm install`)
- Start backend API: `pnpm --filter stepseal-backend start`
- Start web (placeholder): `pnpm --filter stepseal-web dev`

## Roadmap
- Wallet connect and on-chain check-in flow
- Task management and rewards distribution
- Leaderboard aggregation and subgraph queries
