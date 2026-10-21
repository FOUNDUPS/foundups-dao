# Fail-closed network configuration — 2026-10-21

Base: `f78e1255063ed422d26bd90710e8f2f87292a373`.

WSP 97 research inspected README, Hardhat configuration and plugins, environment
extensions, existing tests and deployment callers before implementation. WSP 15
allocation: complexity 2, importance 4, deferability 4, impact 4 = 14/P1.
This is repository configuration repair, with no live-chain or credential action.

## Findings and repair

1. Both public networks inherited a publicly known development mnemonic when no
   credentials were supplied. They now receive an explicit empty signer list.
   Complete explicit keys retain their order and precedence; an explicitly set
   mnemonic remains supported. Partial key sets reject configuration without
   exposing values. Local Hardhat accounts are unchanged.
2. The gas reporter was always loaded, with `enable` instead of its supported
   `enabled` option. An attempted baseline test contacted CoinMarketCap and was
   blocked by automatic approval review. Baseline compilation succeeded, but the
   interrupted test is **not a pass**. The repair loads the reporter only with
   explicit `ENABLE_GAS_REPORT=1` and sets `enabled` correctly. Ordinary tests do
   not load either reporter package. No blocked request was retried.
3. Polygon used the misspelled `chainID` option. The supported `chainId: 137`
   now supplies Hardhat's expected-network validation.

Primary interface reference:
[Hardhat network configuration](https://v2.hardhat.org/hardhat-runner/docs/config).
The local installed reporter implementation was also inspected. These findings
concern future local signing and test execution, not proof of exposed live funds.

## Verification inventory

Existing contract tests remain in Timestamp.spec.js and YieldFarming.spec.js.
NetworkConfig.spec.js adds six controls for missing/blank credentials, explicit
mnemonic, complete key ordering, key precedence, partial-key rejection and real
configuration loading in a credential-free subprocess. That subprocess verifies
both public signer lists are empty, Polygon's chain ID is retained, local test
accounts exist, and neither gas reporter module is loaded. It invokes no provider.
Source inspection found no dotenv loader in the configuration/plugin entry path.

The regression failed against the old configuration's public-network mnemonic.
The repaired focused selection passes six tests on Node 14.21.3. Full contract
and lint results are recorded in the dependency repair receipt after verification.

The legacy `esm` loader fails under Node 24.19.0 before executing Hardhat. An
unsupported Node 14 runtime cannot be described as a fully remediated toolchain.
No production deployment, wallet rotation or signing request was performed.
