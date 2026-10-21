const assert = require('assert')
const proxyaddr = require('proxy-addr')

describe('Proxy address trust boundaries', () => {
  it('does not trust arbitrary IPv4 clients through short IPv6 prefixes', () => {
    for (const subnet of ['::ffff:10.0.0.0/8', '::/1']) {
      assert.strictEqual(proxyaddr.compile(subnet)('203.0.113.8'), false)
    }
  })

  it('preserves correctly scoped IPv4 and mapped IPv6 trust', () => {
    for (const subnet of ['10.0.0.0/8', '::ffff:10.0.0.0/104']) {
      const trust = proxyaddr.compile(subnet)
      assert.strictEqual(trust('10.1.2.3'), true)
      assert.strictEqual(trust('203.0.113.8'), false)
    }
  })
})
