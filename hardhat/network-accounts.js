// Public networks must never fall back to a publicly known development wallet.
// An explicit empty array also prevents use of accounts exposed by an RPC node.
module.exports = function externalNetworkAccounts (environment) {
  const keyNames = ['PKD', 'PK1', 'PK2', 'PK3', 'PK4']
  const read = name => typeof environment[name] === 'string' ? environment[name].trim() : ''
  const keys = keyNames.map(read)
  const supplied = keys.filter(Boolean).length

  if (supplied > 0 && supplied !== keyNames.length) {
    throw new Error('External network credentials are incomplete: provide all PKD/PK1/PK2/PK3/PK4 values or only MNEMONIC')
  }
  if (supplied === keyNames.length) return keys

  const mnemonic = read('MNEMONIC')
  return mnemonic ? { mnemonic } : []
}
