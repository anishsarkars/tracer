# Tracer

### A Two-Sided Variance Market Built on 1inch Aqua

> **Trace volatility, not direction.**

Tracer turns ETH realized variance into a tradable financial instrument on **1inch Aqua**, powered by SwapVM programs running on the official, unmodified `AquaSwapVMRouter`.

Writers deposit collateral into maker vaults. Buyers purchase variance receipts at executable ask prices, holders can exit at executable bid prices before expiry, and remaining receipts can be redeemed for USDC after expiry based on the ETH variance actually realized during the observation window.

Settlement is calculated **on-chain using historical Chainlink oracle rounds**. No external settlement oracle, keeper, or dispute mechanism is required.

Every sold unit is fully collateralized. Its maximum payout is reserved at the moment of sale. Writers cannot withdraw reserved collateral, revoke the vault's Aqua allowance, move unsold inventory, or disable the strategies responsible for paying holders.

A reservation is released only when its corresponding receipt is burned, either through an early exit or final redemption.

Tracer also reuses the same realized-variance primitive to power a volatility-adaptive spread for Aqua AMMs. Since an LP's loss-versus-rebalancing (LVR) is proportional to variance (Milionis, Moallemi, Roughgarden, Zhang), the instrument that pays variance can also help determine the appropriate size of an LVR hedge.

**Tracer brings variance trading and volatility-adaptive liquidity management onto the same shared-liquidity layer.**

---

## Table of Contents

- [Why Variance Receipts?](#why-variance-receipts)
- [How Tracer Works](#how-tracer-works)
- [Architecture](#architecture)
- [SwapVM Integration](#swapvm-integration)
- [Pricing Model](#pricing-model)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Development Commands](#development-commands)
- [Security and Testing](#security-and-testing)
- [Known Limitations](#known-limitations)
- [Deployments](#deployments)
- [Documentation](#documentation)

---

## Why Variance Receipts?

Traditional options require a strike price, exercise rights, an implied volatility surface, and a settlement price.

Tracer takes a different approach.

A capped variance receipt requires only one number: **realized variance over a defined observation window.**

Its payoff is determined by an objective statistic of the historical ETH price path. Because this statistic can be reconstructed from immutable Chainlink round history, settlement requires no additional oracle write, keeper, or dispute resolution.

The capped payoff also makes full collateralization possible. The writer's maximum liability is known in advance.

### Payoff Model

```solidity
payoutPerUnit =
    floor(unitNotional * min(realizedVariance, capVariance) / 1e18);

maxLiability =
    ceil(units * unitNotional * capVariance / 1e36);
```

The maximum liability is reserved as soon as a unit is sold.

This creates three important properties:

1. **Deterministic settlement:** Payouts depend on historical oracle data.
2. **Bounded liability:** Maximum exposure is known before issuance.
3. **Fully backed receipts:** Every outstanding unit has reserved collateral.

---

## How Tracer Works

Tracer operates through three primary market actions.

| Action | Description | Asset Flow |
|---|---|---|
| ISSUE | Purchase variance receipts from the maker vault | USDC → Receipts |
| EXIT | Sell receipts back before expiry | Receipts → USDC |
| SETTLE | Redeem receipts after expiry | Receipts → USDC |

### 1. ISSUE

A buyer purchases variance receipts from the maker vault at the executable ask price.

- The buyer pays USDC.
- The buyer receives ERC-20 variance receipts.
- The vault reserves the maximum possible liability.
- The market's pricing skew increases.

### 2. EXIT

Before expiry, holders can sell their receipts back to the market.

- Receipts are transferred to the router.
- The corresponding receipts are burned.
- The holder receives USDC at the executable bid.
- The associated collateral reservation is released.

### 3. SETTLE

After expiry, holders can redeem their receipts.

- Realized variance is finalized from Chainlink history.
- The payout is calculated using the capped variance.
- Receipts are burned.
- The corresponding reservation is released.

A receipt can be exited or redeemed, but never both.

---

## Architecture

Tracer is composed of specialized contracts, each responsible for a specific part of the protocol.

| Component | Responsibility |
|---|---|
| `VarianceSeriesFactory` | Controller responsible for validating and creating series, deploying strategies, and managing reservations |
| `TracerMarketEngine` | SwapVM `Extruction` target that prices ISSUE, EXIT, and SETTLE |
| `TracerMakerVault` | Deterministic, writer-specific vault with no admin, upgrade, or rescue functionality |
| `VarianceAccumulator` | Bounded permissionless checkpointing and permissionless finalization |
| `VarianceReceipt` | Per-series ERC-20 token with a router-only maker hook that burns every unit leaving the receipt holder |
| `TracerLens` | Read-only interface for market and vault information |
| `TracerPrograms` | Read models exposing raw SwapVM programs |
| `RealizedVarianceOracle` | Provides trailing realized variance for the LVR tools |

### Collateral Reservation Model

Each sold receipt creates a corresponding collateral reservation.

The writer cannot:

- Withdraw reserved collateral.
- Revoke the vault's Aqua allowance.
- Move unsold inventory outside the permitted mechanisms.
- Disable the strategies responsible for exits and settlement.

The reservation remains locked until the corresponding receipt is burned.

This makes the receipt's maximum payout enforceable rather than merely an accounting promise.

---

## SwapVM Integration

Tracer executes its market operations through three standard SwapVM instructions.

**No custom opcodes. No forked router.**

```text
ISSUE
Salt(id, 1)
Deadline(saleEnd)
Extruction(engine, [1, 1, id])

USDC → Receipts


EXIT
Salt(id, 2)
Deadline(expiry)
Extruction(engine, [1, 2, id])

Receipts → USDC + burn hook


SETTLE
Salt(id, 3)
Extruction(engine, [1, 3, id])

Receipts → USDC + burn hook
```

The implementation uses three existing SwapVM instructions:

| Instruction | Opcode | Purpose |
|---|---|---|
| `Salt` | `0x02` | Identifies the market operation |
| `Deadline` | `0x20` | Enforces the relevant execution deadline |
| `Extruction` | `0x04` | Delegates market logic to `TracerMarketEngine` |

All pricing and market-specific logic lives behind the `Extruction` target, `TracerMarketEngine`.

The router compatibility was tested independently in:

```text
contracts/test/RouterCompat.t.sol
```

This test verifies that Tracer's programs work with the pinned official router implementation rather than relying on a modified or forked router.

### Shared Liquidity and Burn Safety

EXIT and SETTLE draw from one real balance through two virtual Aqua allocations.

This is safe because both operations burn the receipts they pay for.

A receipt cannot be redeemed twice or used for both an early exit and final settlement.

The engine also bounds every payout by the collateral liability released through the corresponding burn.

---

## Pricing Model

Tracer uses a single projected-variance value to determine both sides of the market.

The projection represents the variance the market expects over the entire observation window.

### Core Pricing Equations

```text
forward =
    clamp(
        anchorVariance + skew * 2^(-dt / halfLife),
        0,
        cap
    )

projected =
    (realizedSoFar * elapsed + forward * remaining) / duration

ask =
    min(projected * (1 + halfSpread), cap)

bid =
    min(projected * (1 - halfSpread), cap)
```

### How Pricing Evolves

- **Buying:** Increases market skew.
- **Exiting:** Decreases market skew.
- **Time decay:** Skew decays toward the anchor variance according to its half-life.
- **Realized variance:** As the observation window progresses, the projection increasingly reflects actual realized variance.

Fills are priced using the **integral of the marginal price across the trade size**.

This prevents users from obtaining better execution simply by splitting one large transaction into multiple smaller transactions.

As the observation window progresses, the projection converges toward the variance that has actually occurred. This prevents late buyers from pricing their positions based on variance that has already been realized.

### Important Distinction

Tracer does not use implied volatility.

There is no options surface, strike price, or implied volatility calculation.

It is an executable market for realized variance.

---

## Repository Structure

```text
tracer/
│
├── contracts/
│   ├── Foundry contracts
│   ├── Pricing libraries
│   ├── Reference vectors
│   └── Tests and fork-based E2E suites
│
├── backend/
│   ├── Rust (Axum)
│   ├── Event indexer
│   ├── Chainlink round cache
│   ├── Off-chain pricing replicas
│   └── Read API (:8787)
│
├── subgraph/
│   └── The Graph entities and event history
│
├── web/
│   ├── Next.js 16
│   ├── Markets
│   ├── Series terminal
│   ├── Writer flow
│   ├── Portfolio
│   ├── LVR calculator
│   └── Documentation
│
├── sim/
│   └── Ten-scenario economic simulation
│
├── docs/
│   └── Submission and technical evidence
│
├── ARCHITECTURE.md
├── DESIGN.md
└── Makefile
```

### Repository Components

| Directory | Technology | Purpose |
|---|---|---|
| `contracts/` | Solidity, Foundry | Smart contracts, pricing, and protocol tests |
| `backend/` | Rust, Axum | Indexing, oracle history, and API |
| `subgraph/` | The Graph | On-chain event indexing |
| `web/` | Next.js 16 | Frontend application |
| `sim/` | Simulation tooling | Economic and invariant testing |

`ARCHITECTURE.md` is the binding technical specification shared across the repository.

`DESIGN.md` defines the visual system.

---

## Getting Started

### Prerequisites

Make sure the following tools are installed:

- Git
- Node.js
- Yarn
- Rust and Cargo
- Foundry
- Make

### 1. Clone the Repository

Clone the repository with its submodules:

```bash
git clone --recurse-submodules <repo> tracer

cd tracer
```

### 2. Install SwapVM Dependencies

The Foundry remappings point to the vendored SwapVM library.

Install its Node dependencies once:

```bash
cd contracts/lib/swap-vm

yarn install --frozen-lockfile

cd ../../..
```

### 3. Start the Complete Development Environment

Run:

```bash
make dev
```

This starts the development stack:

| Service | Local URL |
|---|---|
| Anvil / Local Chain | `http://localhost:8545` |
| Backend API | `http://localhost:8787` |
| Frontend | `http://localhost:3000` |

The development script:

1. Forks Base.
2. Deploys the contracts.
3. Seeds the demo lifecycle.
4. Starts the backend indexer.
5. Launches the frontend.

It skips steps that are already satisfied.

### Alternative Startup Options

```bash
# Re-fork and redeploy from scratch
scripts/dev.sh --fresh

# Deploy contracts without running the demo lifecycle
scripts/dev.sh --no-seed

# Run the frontend on a custom port
WEB_PORT=3100 scripts/dev.sh
```

Press `Ctrl + C` to stop the processes started by the script.

Development logs are stored in:

```text
.dev-logs/
```

---

## Development Commands

Individual services can also be started independently.

```bash
# Terminal 1: Fork Base mainnet
make anvil

# Terminal 2: Run contract tests and deploy demo
make test && make demo

# Terminal 3: Start the Rust backend
make backend

# Terminal 4: Start the Next.js frontend
make web
```

### Demo Lifecycle

The demo script demonstrates the complete protocol lifecycle and validates important security properties.

**Stage C: Security and Attack Testing**

Attempts several potential writer attacks:

- Withdrawing reserved collateral.
- Revoking the Aqua allowance.
- Moving unsold inventory.
- Disabling a burn strategy leg.

All tested attacks revert.

**Stage E: Historical Settlement**

Creates a chain-31337-only, backdated five-day series and:

1. Processes real Chainlink history using bounded, permissionless checkpoints.
2. Finalizes the realized variance.
3. Redeems outstanding receipts.
4. Closes the series.
5. Verifies USDC balance changes at every stage.

---

## Security and Testing

**Verification status: September 12, 2026**

Tracer has been tested across its contract, backend, frontend, deployment, and simulation layers.

### Test Results

| Verification | Result |
|---|---|
| Foundry test suite | **216 passed, 0 failed, 0 skipped** |
| Test coverage structure | 20 suites |
| Fuzz testing | 128 runs |
| Stateful invariants | 12 invariants pass across two campaigns |
| Base-fork E2E | Passed against live Base fork |
| Router compatibility | Passed |
| Pricing reference vectors | 60 cases at 60-digit precision |
| Backend | Formatting, Clippy, and 54 tests passed |
| Subgraph | Codegen, build, and 4 Matchstick tests passed |
| Frontend | 47 unit tests passed |
| Frontend production build | 35 pages / 14 routes |
| Simulation | 10 scenarios, no invariant failures |

### Additional Verification

**Stateful invariants**

Twelve invariants pass across two campaigns. Each includes a scripted non-vacuity test demonstrating that the handler actually reaches the relevant states.

**Base-fork end-to-end tests**

Both lifecycle tests passed against a live Base fork:

- `ForkE2E`: 161.5 seconds
- `PortfolioForkE2E`: 168.3 seconds

**Pricing consistency**

Sixty reference cases were evaluated at 60-digit precision. Solidity and TypeScript pricing replicas agree exactly.

**Contract sizes**

| Contract | Runtime Bytecode | Initcode |
|---|---:|---:|
| Portfolio market | 20,943 bytes | 40,257 bytes |
| Controller | 17,892 bytes | 46,684 bytes |

The controller is 2,468 bytes below the EIP-3860 initcode limit. Every contract remains within the EIP-170 runtime size limit.

**Reproducible deployment**

Ten out of ten deployed contracts match the local build byte-for-byte outside immutable slots, including the official `AquaSwapVMRouter`.

### Known Verification Failures

At this revision:

- `forge fmt --check` reports issues in two files under active editing.
- `cargo clippy --all-targets` reports two test-code lints.

These are explicitly documented rather than reported as passing.

Full audit:

[`docs/submission/FINAL_AUDIT.md`](docs/submission/FINAL_AUDIT.md)

---

## Known Limitations and Honest Caveats

Tracer is designed around bounded, transparent variance exposure. However, several limitations are important to understand.

### 1. The Variance Cap Truncates Payouts

A highly volatile observation window can realize variance significantly above the configured cap.

Holders receive the capped payout, not the uncapped realized variance.

The interface communicates the cap in volatility terms and displays where the payoff curve flattens.

### 2. Checkpointing Requires Transaction Submission

Checkpointing and finalization are permissionless and bounded, but there is currently no direct incentive payment for performing them.

Participants who need quotes, redemptions, or cap-surplus calculations depend on these operations being completed.

### 3. Exit Liquidity Is Finite

Large exits can consume available bid depth and are additionally constrained by the collateral released through receipt burns.

Consequently, a large exit may partially fill at a worse average price than the initial top-of-book bid.

### 4. Chainlink Feed Gaps Can Understate Variance

Repeated Chainlink rounds contribute zero returns.

A 30-minute minimum sampling interval is used because finer sampling made repeated rounds common on Base.

This can bias measured variance downward during periods of insufficient oracle updates.

### 5. Tracer Is Not a Conventional Variance Swap

Tracer is:

- Not an order book.
- Not a conventional variance swap.
- Not a fair-value oracle.
- Not a perfect LVR hedge.

Further details:

[`web/src/content/docs/about/trust-surface.md`](web/src/content/docs/about/trust-surface.md)

### 6. Public Quote Token Is a Test Token

On Base Sepolia, the quote asset is Tracer's own `MockUSDC`:

```text
0x13a058bE25Da579e0858d689F5982eDaCE8356B7
```

It is freely mintable and has no monetary value.

Although its ERC-20 `symbol()` returns `"USDC"`, it is not Circle USDC. This can be misleading in wallets and block explorers.

### 7. Portfolio Checkpoints Use the Rust Backend

Portfolio checkpoints are indexed by the Rust backend rather than The Graph.

The subgraph's `Checkpointed` handler is bound to the v2 series accumulator.

The currently published Studio endpoint references a superseded deployment, so the application ships with the subgraph disabled until it is republished.

### 8. Public On-Chain Evidence Is Currently One-Sided

Base Sepolia Group 1 demonstrates:

- HIGH issuance through the router.
- HIGH settlement through the router.
- Finalization using Chainlink history.

The following are currently demonstrated in local fork tests only:

- CALM issuance.
- Shared `max(h,c)` reservation.
- Exit buffers.
- EXIT execution.

Full evidence:

[`docs/submission/ONCHAIN_EVIDENCE.md`](docs/submission/ONCHAIN_EVIDENCE.md)

### 9. Contract Sources Are Not Verified on Basescan

A reproducible-build verification script matches deployed runtime bytecode against the local build.

However, bytecode reproduction is not equivalent to explorer source-code verification.

Verification script:

```text
docs/submission/evidence/verify-deployed-bytecode.py
```

---

## Deployments

Tracer deployment manifests are maintained at:

```text
contracts/deployments/<chainId>.json
```

The current manifest uses **schema version 3**, which includes:

- Portfolio market.
- Portfolio accumulator.
- Pinned router bytecode hash.

### Supported Networks

| Network | Chain ID | Status |
|---|---:|---|
| Local Base Fork | `31337` | Development |
| Base Sepolia | `84532` | Public test deployment |

Base Sepolia deployment block:

```text
46685189
```

### Canonical Aqua on Base

```text
0x1111113ccf1426a8e30e2bff5e005d929bf6a90a
```

### Base Sepolia Contract Addresses

| Contract | Address |
|---|---|
| `TracerPortfolioMarket` | `0x72798A6697Cb648847ec0E5ba0bc6491B2901ddb` |
| `AquaSwapVMRouter` (official, unmodified) | `0xb8dcED3Cf6266Dd8fEc05849fce3734B79A7e722` |
| Aqua | `0x3B568C149DDf92Bd1f7deF40bDD8930503e70B31` |
| Portfolio `VarianceAccumulator` | `0xea5A9Cfb462509f51420E10f5732891481fE634F` |
| Writer Maker Vault | `0x9C9341d0E752a97BD1c7c47FB1579866daBCc47C` |
| MockUSDC (test token) | `0x13a058bE25Da579e0858d689F5982eDaCE8356B7` |
| Chainlink ETH/USD | `0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1` |

For the complete address table and live-query commands, see:

[`docs/submission/ONCHAIN_EVIDENCE.md`](docs/submission/ONCHAIN_EVIDENCE.md)

### Router Source Reproducibility

The deployment manifest's `routerSourceCommit` currently returns `"unknown"` because the vendored `contracts/lib/swap-vm` directory does not contain its Git metadata.

The upstream commit therefore cannot be recovered from the vendored source.

Instead, Tracer provides reproducible bytecode evidence demonstrating that the deployed router matches the local build.

See:

[`docs/submission/AQUA_SWAPVM_EVIDENCE.md`](docs/submission/AQUA_SWAPVM_EVIDENCE.md)

---

## Documentation

For deeper technical information, refer to:

| Document | Description |
|---|---|
| `ARCHITECTURE.md` | Binding protocol architecture and technical specification |
| `DESIGN.md` | Frontend design system |
| `docs/submission/FINAL_AUDIT.md` | Full audit and verification report |
| `docs/submission/ONCHAIN_EVIDENCE.md` | Deployment addresses and on-chain evidence |
| `docs/submission/AQUA_SWAPVM_EVIDENCE.md` | Official SwapVM router compatibility and bytecode evidence |
| `web/src/content/docs/about/trust-surface.md` | Protocol limitations and trust assumptions |

---

## Core Design Principles

Tracer is built around a few fundamental principles:

1. **Variance over direction:** Trade realized volatility rather than guessing whether ETH goes up or down.
2. **Executable pricing:** Quotes represent executable market prices, not indicative estimates.
3. **Fully collateralized issuance:** Every sold unit has its maximum liability reserved.
4. **Deterministic settlement:** Final payouts are computed from historical Chainlink data.
5. **Permissionless operations:** Checkpointing and finalization do not depend on privileged operators.
6. **Native Aqua integration:** Use the official, unmodified SwapVM router without custom opcodes or protocol forks.

> **Tracer: Make volatility tradable. Make liquidity adaptive.**
