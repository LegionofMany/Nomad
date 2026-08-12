import { enrollPassword, verifyPassword } from '../passwordCredential';

describe('wallet password credential', () => {
  test('stores a verifier and returns the same ephemeral access key for the correct password', async () => {
    const password = 'correct horse battery staple';
    const enrollment = await enrollPassword(password);
    const verified = await verifyPassword(password, enrollment.credential);

    expect(enrollment.credential.verifierHex).not.toContain(password);
    expect(verified.ok).toBe(true);
    if (verified.ok) expect(verified.accessKey).toBe(enrollment.accessKey);
  });

  test('rejects an incorrect password without returning an access key', async () => {
    const enrollment = await enrollPassword('correct horse battery staple');
    await expect(verifyPassword('wrong password', enrollment.credential)).resolves.toEqual({ ok: false });
  });

  test('requires a strong-enough enrollment password', async () => {
    await expect(enrollPassword('too-short')).rejects.toThrow('at least 12 characters');
  });
});
