# Dependency repair — 2026-10-21

Base: `f78e1255063ed422d26bd90710e8f2f87292a373`.

## Scope and allocation

WSP 97 research-first maintenance slice, coordinated under WSP 77. WSP 15
allocation: complexity 4, importance 4, deferability 4, impact 4 = 16/P0.
The immediate objective is a compatible dependency repair with reproducible
contract tests. This is local repository maintenance; it does not install WRE
scheduling or activate services. No deployment, credential operation, external
scan submission, or live-chain transaction is part of this work.

Repository inventory: README, package.json, yarn.lock, hardhat.config.js,
.github/workflows/CI.yaml, scripts/mainDeploy.js, and both existing test files
were inspected before mutation. No repository AGENTS.md, test README, or
TestModLog existed. The existing Timestamp and YieldFarming tests own contract
compatibility verification. The WSP framework is in the sibling Foundups-Agent
repository; its lexical source inspection is not evidence of a current semantic
HoloIndex for this repository.

The initial installation is frozen to the exact baseline lockfile with lifecycle
scripts disabled. Verification proceeds from installed-version checks to lint,
compile, contract tests, and coverage. A failed installation or unavailable
compiler is a coverage failure, never a clean scan.

## Research and intended change

The simplest bounded change is to retain the existing Hardhat, ethers, Waffle,
Solidity compiler and contract API versions while updating selected transitive
packages. A toolchain-major migration is a separate compatibility project.
Selective Yarn resolutions are already used here for adm-zip; they provide an
explicit, reviewable security floor. Exact package metadata is fetched from the
public npm registry; no dependency inventory is sent to an audit service.

| Package | Selected version | Primary advisory |
| --- | --- | --- |
| handlebars | 4.7.10 | [GHSA-8r5x-fm3f-whwj](https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-8r5x-fm3f-whwj) |
| immutable | 4.3.9 | [GHSA-xvcm-6775-5m9r](https://github.com/immutable-js/immutable-js/security/advisories/GHSA-xvcm-6775-5m9r) |
| brace-expansion | 1.1.17 | [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) |
| lodash | 4.18.1 | [GHSA-r5fr-rjxr-66jc](https://github.com/lodash/lodash/security/advisories/GHSA-r5fr-rjxr-66jc) |
| elliptic | 6.6.1 | [GHSA-vjh7-7g9h-fjfh](https://github.com/advisories/GHSA-vjh7-7g9h-fjfh) |
| flatted 3.x | 3.4.4 (manifest floor 3.4.2) | [GHSA-rf6f-7fwh-wjgh](https://github.com/advisories/GHSA-rf6f-7fwh-wjgh) |
| minimist | 1.2.8 | [GHSA-xvch-5gv4-984h](https://github.com/advisories/GHSA-xvch-5gv4-984h) |
| underscore | 1.13.8 | [GHSA-qpx9-hpmf-5gmw](https://github.com/advisories/GHSA-qpx9-hpmf-5gmw) |
| jsprim / json-schema | 1.4.2 / 0.4.0 | [GHSA-896r-f27r-55mw](https://github.com/advisories/GHSA-896r-f27r-55mw) |
| @babel/traverse | 7.29.10 | [GHSA-67hx-6x53-jw92](https://github.com/babel/babel/security/advisories/GHSA-67hx-6x53-jw92) |

Research retrieved 2026-10-21. In particular, brace-expansion 1.1.16 in existing
PR #2 is insufficient for the later July advisory. The lodash maintainer advisory
currently names 4.18.1, superseding older 4.17.21 remediation advice. Package
metadata independently confirms these versions exist. Updating jsprim brings
its own declared json-schema 0.4.0 dependency instead of overriding its API
directly. Several legacy parents pin elliptic, underscore or lodash exactly;
contract tests are required before accepting those resolution overrides.

Only flatted 3.x lock selectors are refreshed, with the direct manifest floor
raised; flatted 2.x remains explicitly unresolved rather than forcing a major
version across an old consumer. The first Babel update exposed a real lint
compatibility failure: babel-eslint 10 crashed in template-curly-spacing with
newer Babel tokens. Default Espree could not parse the existing RecordList class
fields. The repair replaces deprecated babel-eslint with the official
@babel/eslint-parser 7.29.9 and @babel/core 7.29.7, preserving source behavior and
all existing lint rules. Registry engine/peer metadata confirms Node 14 and
ESLint 7 compatibility. Babel config discovery is disabled for this lint-only
parser. [Babel parser documentation](https://babeljs.io/docs/babel-eslint-parser/)
defines these options. Babel 8 was explicitly excluded because it requires a
newer Node and ESLint major.

The first frozen installation under Node 14 correctly rejected node-releases
2.0.59 (requires Node >=18). The Babel-only browserslist path is therefore pinned
to 4.28.2 and node-releases to 2.0.44, using published package engine/dependency
metadata. The old Babel 6 browserslist major is preserved. This compatibility
constraint must be reconsidered with the separate Node-runtime migration; engine
validation is not bypassed.

## CI integrity

The existing CI uses pinned Yarn 1.22.22 and a frozen lockfile with lifecycle
scripts disabled, matching the tested installation. Actions are pinned to
official release commits resolved directly from their upstream Git refs:

| Action | Release | Commit |
| --- | --- | --- |
| actions/checkout | 7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node | 7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| actions/cache | 5.1.0 | `caa296126883cff596d87d8935842f9db880ef25` |
| coverallsapp/github-action | 2.3.8 | `8d6379e14d29928660c4ba802d8e85393440b329` |

Tag-to-commit evidence was retrieved with `git ls-remote --tags` directly from
each named upstream repository on 2026-10-21, including the exact version tags
listed above. The Coveralls reporter v0.6.22 annotated tag
`e691ef9d703b9535d65fdcff0c06fad6dbd97bc8` peels to source commit
`b62dacb2db63d77c358e7dd07dc07cd24a9dcafe` in
[coverage-reporter](https://github.com/coverallsapp/coverage-reporter/tree/v0.6.22).
These source refs identify the selected releases; release-asset verification
still depends on the action's checksum check.

The Coveralls reporter is fixed to v0.6.22, with the action's upstream checksum
verification retained, and only coverage/lcov.info selected for the existing
upload. The workflow grants contents:read, does not persist checkout credentials,
uses GITHUB_OUTPUT instead of deprecated set-output, and explicitly disables gas
reporting. No additional write permission or new external destination is added.
Upstream references: [checkout](https://github.com/actions/checkout),
[setup-node](https://github.com/actions/setup-node),
[Coveralls action](https://github.com/coverallsapp/github-action).

## Applicability and residual scope

These are build/test/signing-tool dependencies. A vulnerable package version
does not prove a reachable deployed-contract exploit. The Solidity source,
deployment addresses and live bytecode are not changed or certified here.
No whole-repository or full dependency graph clean verdict is implied.

The legacy stack also contains flatted 2.0.2, unpatched babel-traverse 6.26.0,
crypto-js 3.3.0, old tar/ws/yargs-parser families,
OpenZeppelin 4.2.0 and deprecated tooling. Those need separate owner upgrades
and applicability review; forcing one modern major version across all old API
consumers is not a safe resolution strategy. Elliptic 6.6.1 addresses the cited
critical malformed-input flaw but still has a separate low-severity advisory
[GHSA-848j-6mx2-7j84](https://github.com/advisories/GHSA-848j-6mx2-7j84).
The Node 14 CI runtime is end-of-life and requires a separately tested toolchain
migration: the existing esm loader was observed failing before Hardhat execution
on both Node 22.23.3 and 24.19.0. Updating the action's own runtime does not fix
that project-runtime gap. Flattened vendored Solidity files do not receive fixes merely by
upgrading the npm OpenZeppelin dependency.

## Verification

Environment: Linux, Node 14.21.3 (matching the existing project's CI major),
Yarn 1.22.22. Signing credentials are excluded from the contract-test process;
gas reporting is explicitly disabled. No live provider is invoked.

| Gate | Result |
| --- | --- |
| Frozen offline installation under Node 14, lifecycle scripts disabled | Pass; no engine bypass |
| Full repository ESLint after parser migration | Pass, exit 0 |
| Existing Solidity lint selection | Pass, exit 0 |
| Lockfile parse and installed remediation version inventory | Pass; residual versions listed above remain |
| Workflow YAML, full-SHA action refs, read-only contents permission | Pass; hosted workflow execution remains a separate gate |
| Final instrumented compile and contract/configuration suite | Pass, exit 0; 49 passing, one existing pending |

Baseline compilation built 20 Solidity files. The initial baseline test was
blocked by automatic approval review because the old reporter attempted an
external CoinMarketCap request; it is not counted as a pass. After the separate
configuration repair, the baseline dependencies passed 49 tests with one existing
pending case. The first dependency candidate also passed 49 tests and coverage,
but full lint exposed the parser incompatibility described above; that candidate
was not accepted until the lint failure was repaired.

Coverage uses the existing .solcover.js selection: six application contracts.
The final run reports 99.09% statements, 95% branches, 100% functions and
99.12% lines for that selected scope.
It excludes ABDK, ERC20Mock, UChildERC20 and UChildERC20Proxy; coverage percentages
must not be presented as full source security coverage. The existing pending
TokenTimeLock release-time case remains pending, with no test weakened or removed.
No npm/yarn audit submission or new external scanner was used. actionlint is
unavailable locally; CI is the authoritative workflow execution check. This
receipt records bounded compatibility evidence, not a clean security audit.
