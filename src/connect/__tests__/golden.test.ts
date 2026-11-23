import { buildAttestationMessage, buildSignInMessage } from '../messages';

/**
 * The exact text a wallet signs. Zonycs (backend/src/services/nomadConnect.ts) and Reqrium
 * (lib/nomadConnect.ts) keep their OWN copy of this wording and test it against these same literals.
 * If you change the wording here you must change it there, or sign-in and verified proofs stop working.
 */
describe('golden messages shared with Zonycs and Reqrium', () => {
  it('sign-in message', () => {
    expect(
      buildSignInMessage({
        origin: 'https://zonycs.example',
        address: '0x1111111111111111111111111111111111111111',
        nonce: 'nonce-1234567890abcdef',
        requestId: 'req-1234567890abcdef',
        issuedAt: '2026-11-23T12:00:00.000Z',
        expiresAt: '2026-11-23T12:05:00.000Z',
        statement: 'Sign in to Zonycs.',
      }),
    ).toBe(
      [
        'https://zonycs.example wants you to sign in with your Nomad wallet.',
        '',
        'Sign in to Zonycs.',
        '',
        'Address: 0x1111111111111111111111111111111111111111',
        'URI: https://zonycs.example',
        'Version: 1',
        'Nonce: nonce-1234567890abcdef',
        'Request ID: req-1234567890abcdef',
        'Issued At: 2026-11-23T12:00:00.000Z',
        'Expiration Time: 2026-11-23T12:05:00.000Z',
        '',
        'Signing this does not move money and does not give the app any access to your funds.',
      ].join('\n'),
    );
  });

  it('attestation message', () => {
    expect(
      buildAttestationMessage({
        v: 1,
        issuer: 'reqrium',
        subject: '0x1111111111111111111111111111111111111111',
        claim: 'verified_person',
        issuedAt: '2026-11-23T12:00:00.000Z',
        expiresAt: '2026-12-23T12:00:00.000Z',
      }),
    ).toBe(
      [
        'reqrium attests that this wallet holds the claim: verified_person',
        'Subject: 0x1111111111111111111111111111111111111111',
        'Version: 1',
        'Issued At: 2026-11-23T12:00:00.000Z',
        'Expiration Time: 2026-12-23T12:00:00.000Z',
      ].join('\n'),
    );
  });
});
