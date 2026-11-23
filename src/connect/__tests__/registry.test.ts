import { DEV_REGISTRY, findApp, withAppOrigin } from '../registry';

describe('withAppOrigin', () => {
  it('trusts the exact https origin of a registered app, and only the origin', () => {
    const r = withAppOrigin(DEV_REGISTRY, 'zonycs', 'https://zonycs.example/some/path?x=1');
    expect(findApp(r, 'zonycs')?.origins).toContain('https://zonycs.example');
    expect(findApp(r, 'zonycs')?.origins.some((o) => o.includes('/some'))).toBe(false);
  });

  it('does not change other apps', () => {
    const r = withAppOrigin(DEV_REGISTRY, 'zonycs', 'https://zonycs.example');
    expect(findApp(r, 'reqrium')?.origins).toEqual(findApp(DEV_REGISTRY, 'reqrium')?.origins);
  });

  it('ignores missing, unknown-app, plain-http and malformed values', () => {
    expect(withAppOrigin(DEV_REGISTRY, 'zonycs', undefined)).toBe(DEV_REGISTRY);
    expect(withAppOrigin(DEV_REGISTRY, 'nobody', 'https://x.example')).toBe(DEV_REGISTRY);
    expect(withAppOrigin(DEV_REGISTRY, 'zonycs', 'http://zonycs.example')).toBe(DEV_REGISTRY);
    expect(withAppOrigin(DEV_REGISTRY, 'zonycs', 'not a url')).toBe(DEV_REGISTRY);
  });

  it('does not add the same origin twice', () => {
    const once = withAppOrigin(DEV_REGISTRY, 'zonycs', 'https://zonycs.example');
    const twice = withAppOrigin(once, 'zonycs', 'https://zonycs.example');
    expect(findApp(twice, 'zonycs')?.origins.filter((o) => o === 'https://zonycs.example')).toHaveLength(1);
  });

  it('points Zonycs answers at the sign-in callback page', () => {
    expect(findApp(DEV_REGISTRY, 'zonycs')?.callbackPath).toBe('/sign-in/nomad');
  });
});
