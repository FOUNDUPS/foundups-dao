const assert = require('assert')
const path = require('path')
const { execFileSync } = require('child_process')
const externalNetworkAccounts = require('../hardhat/network-accounts')

describe('External network signing credentials', () => {
  const names = ['PKD', 'PK1', 'PK2', 'PK3', 'PK4']
  // Deliberately invalid credential markers: never usable to sign transactions.
  const explicit = Object.fromEntries(names.map(name => [name, `synthetic-${name}`]))

  it('disables signing when credentials are missing or blank', () => {
    assert.deepStrictEqual(externalNetworkAccounts({}), [])
    assert.deepStrictEqual(externalNetworkAccounts({ MNEMONIC: '  ', PKD: ' ' }), [])
  })

  it('accepts only an explicitly configured mnemonic', () => {
    assert.deepStrictEqual(externalNetworkAccounts({ MNEMONIC: ' configured mnemonic ' }), {
      mnemonic: 'configured mnemonic'
    })
  })

  it('preserves the ordering of a complete explicit key set', () => {
    assert.deepStrictEqual(externalNetworkAccounts(explicit), names.map(name => explicit[name]))
  })

  it('preserves explicit key precedence when a mnemonic is also configured', () => {
    assert.deepStrictEqual(externalNetworkAccounts({ ...explicit, MNEMONIC: 'unused mnemonic' }),
      names.map(name => explicit[name]))
  })

  it('rejects every incomplete key set even when a mnemonic is present', () => {
    for (const missing of names) {
      const partial = { ...explicit, MNEMONIC: 'unused mnemonic' }
      delete partial[missing]
      assert.throws(() => externalNetworkAccounts(partial), error => {
        assert.match(error.message, /credentials are incomplete/)
        assert.ok(!error.message.includes('synthetic-'))
        assert.ok(!error.message.includes('unused mnemonic'))
        return true
      })
    }
  })

  it('loads both public networks without signers while preserving local test accounts', function () {
    this.timeout(20000)
    // Load the real Hardhat configuration in a credential-free child. No network
    // provider is invoked and no parent environment credentials are inherited.
    execFileSync(process.execPath, ['--require', 'esm', '-e', `
      const assert = require('assert');
      const { config } = require('hardhat');
      assert.deepStrictEqual(config.networks.polygon.accounts, []);
      assert.deepStrictEqual(config.networks.mumbai.accounts, []);
      assert.strictEqual(config.networks.polygon.chainId, 137);
      assert.ok(config.networks.hardhat.accounts.count > 0);
      assert.strictEqual(config.gasReporter.enabled, false);
      assert.ok(!Object.keys(require.cache).some(file =>
        file.includes('/hardhat-gas-reporter/') || file.includes('/eth-gas-reporter/')));
    `], {
      cwd: path.join(__dirname, '..'),
      env: { PATH: process.env.PATH, CI: 'true' },
      timeout: 15000,
      stdio: 'pipe'
    })
  })
})
