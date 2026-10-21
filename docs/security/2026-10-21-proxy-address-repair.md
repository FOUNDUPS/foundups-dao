# Proxy address dependency repair

WSP 97 research-first follow-up to the dependency repair, based on exact main
`1fcd6d965afc2220b40e9bb9ab24ad865d29593a`. Mail is a discovery signal, not proof
of application exposure. Main and Dependabot PR #8 were independently read on
2026-10-21. PR #8 head `625b698bb51e70942dec6b6cf768b8a9438591ce` changes only
three lockfile lines from proxy-addr 2.0.7 to 2.0.8; this repair preserves the
existing npm registry URL and adds a local regression test and this receipt.

## Research and applicability

The [maintainer advisory GHSA-jqcg-44mw-7w3h](https://github.com/jshttp/proxy-addr/security/advisories/GHSA-jqcg-44mw-7w3h)
(CVE-2026-90711, published September 15, 2026) rates the package issue critical,
CVSS 9.1. Versions >=1.1.0 and <2.0.8 are affected. Improperly scoped IPv6 proxy
trust configuration can trust arbitrary IPv4 clients and enable spoofed
forwarded client addresses. Version 2.0.8 is the documented fix.

The exact main lockfile contained 2.0.7. Local dependency tracing identifies
web3 -> web3-bzz -> swarm-js -> eth-lib -> servify -> express -> proxy-addr.
Tracked DAO source inspection found no direct Express listener or trust-proxy
configuration. Installed servify can create an Express listener but does not
configure trust proxy; installed Express defaults it to false. Vulnerable
package presence is confirmed with high confidence; reachable deployed
application exploitation is not established. No deployed contract or live
provider was inspected or changed.

Public npm package metadata independently confirms version 2.0.8, unchanged
dependencies (forwarded 0.2.0 and ipaddr.js 1.9.1), Node >=0.10 compatibility,
and integrity:
`sha512-5nnx0yGyVUcY6t9RnWcARWtwT9F1D8O9rt08htPvnd49W1IgZtmLkhu9WfMzQj1cFxjHIO6connUNVW5k7AVyQ==`.
No dependency inventory was transmitted to an audit service.

## Verification

Node 22.23.3 and Yarn 1.22.22; frozen installation with lifecycle scripts
disabled succeeded and installed proxy-addr reports 2.0.8. The focused test
rejects arbitrary IPv4 trust via short IPv6 prefixes and preserves correctly
scoped IPv4 and mapped-IPv6 trust. Tests run without inherited credentials and
with gas reporting disabled. Full ESLint and Solidity lint passed, exit 0.
The full contract/configuration suite passed, exit 0: 52 passing and one existing
pending test, including both new trust-boundary regressions. No provider was
invoked and no coverage-percentage claim is added. This bounded repair does not resolve the remaining
legacy dependency families documented in the earlier review.
