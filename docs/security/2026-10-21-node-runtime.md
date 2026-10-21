# Node runtime migration — 2026-10-21

Base configuration: `cbcec4c6bce5802cf869508be1e762f2ce31a92b`.
Final dependency baseline: local `2065c9bfa76c8a3795a9cecb1a46b091d2736ce5`,
tree `a6ab5384ba0782dd765b9b3354d2a61b0246d670` (dependency PR #7).
WSP 97 scope is repository maintenance, with no service activation, external
network signing, deployment, credential operation or audit-service submission.
WSP 15 allocation: complexity 3, importance 4, deferability 4, impact 4 = 15/P1.

## Research and existing owners

The package entry preloads `esm`; config, deploy scripts, helpers and two contract
tests use ESM import/export syntax. Existing Hardhat plugins and package settings
use CommonJS. The deprecated loader fails on Node 22/24 before Hardhat executes.
The simplest candidate is native CommonJS loading with equivalent named exports
and function properties for deployment tags/dependencies. Changing contracts,
Hardhat/ethers majors or live networks is outside this bounded slice.

Read before mutation: README, package and lint configuration, every import/export
site, hardhat/env-contract.js, deployment/helper consumers and the existing
Timestamp, YieldFarming and NetworkConfig tests. No independent browser or live
chain coverage is claimed. Existing contract tests own behavior verification;
NetworkConfig owns credential-free configuration and loader checks.

Primary runtime evidence: the [Node release schedule](https://github.com/nodejs/Release)
places Node 22 in Maintenance LTS through 2027-04-30. Current Hardhat 2 tutorials
use Node 22, but that does not certify the repository's legacy Hardhat 2.4.2.
Executed compatibility evidence and upstream support claims remain distinct.

## Verification

Initial native-loader prototype compiled 20 Solidity files with unchanged
compilers (0.6.6/0.8.4) and settings. Node 22.23.3 ran 50 passing tests and the
one pre-existing pending test, `TokenTimeLock: release time is before current time`.
The original 49 tests are preserved; one additional assertion verifies callable
deployment exports and their tags/dependencies without invoking deployment.
The credential-free child also proves no `esm` module or gas reporter is loaded.

Force-compiling this same native-loader tree on Node 14.21.3 and Node 22.23.3
produced identical ABI, bytecode, deployed bytecode and link-reference fields for
all 28 local contract artifacts. No Solidity source or optimizer setting changed.
The installed Hardhat 2.4.2 emits no modern-Node warning, which is not evidence
of upstream support for that old version.

The initial `--no-compile` diagnostic used copied instrumented coverage artifacts
and failed the contract-size limit; it is not accepted compatibility evidence.
The subsequent clean force-compile and full run above replaced that invalid
artifact baseline.

After rebasing on the exact dependency repair, Node 22.23.3 and Yarn 1.22.22
passed an offline frozen-lockfile installation with scripts disabled, full
ESLint, Solidity lint, and instrumented coverage (50 passing, one unchanged
pending test; exit 0). Coverage is 99.12% of lines for the six configured
contracts only; existing exclusions are unchanged. The instrumented contract
size warning does not describe the uninstrumented deployable artifact.
The actual `yarn hardhat --version` entry succeeds without the loader preload.

The project now requires Node >=22.23.3 <23, records the tested version in
`.nvmrc`, and runs CI on Node 22.x. Removing `esm` is the only lockfile delta
from the dependency baseline. Existing dependency-version pins are retained
to isolate the runtime migration. No engine checks or lint rules are bypassed.
Required remote CI and root merge/readback remain separate closure evidence.
The ordinary gas reporter remains unloaded, and public networks retain empty
signer lists when credentials are absent. Deployment modules may be inspected
as exports but are never invoked against public networks.
