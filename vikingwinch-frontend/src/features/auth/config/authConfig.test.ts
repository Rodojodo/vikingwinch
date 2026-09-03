import { vi, describe, it, expect, beforeAll } from 'vitest';

// Provide env values before the module is evaluated
vi.stubEnv('VITE_AZURE_CLIENT_ID', 'test-client-id');
vi.stubEnv('VITE_AZURE_TENANT_ID', 'test-tenant-id');

// Mock the msal-browser export so constructing msalInstance is safe and observable
const MockPublicClientApplication = vi.fn(function (config: unknown) {
  // attach the config so tests can inspect the instance
  // @ts-expect-error - deliberate dynamic property for test introspection
  this._constructedWith = config;
});

vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: MockPublicClientApplication,
}));

let authModule: typeof import('./authConfig.ts');

beforeAll(async () => {
  // import after env/mocks are set
  authModule = await import('./authConfig.ts');
});

describe('authConfig', () => {
  it('exports msalConfig with expected auth and cache settings', () => {
    const { msalConfig } = authModule;

    expect(msalConfig).toBeDefined();
    expect(msalConfig.auth.clientId).toBe('test-client-id');
    expect(msalConfig.auth.authority).toBe('https://login.microsoftonline.com/test-tenant-id');
    expect(msalConfig.auth.redirectUri).toBe('http://localhost:5173');

    expect(msalConfig.cache).toBeDefined();
    expect(msalConfig.cache!.cacheLocation).toBe('sessionStorage');
  });

  it('creates msalInstance using PublicClientApplication with msalConfig', () => {
    const { msalConfig, msalInstance } = authModule;

    // constructor should have been called once with the config
    expect(MockPublicClientApplication).toHaveBeenCalledWith(msalConfig);

    // the created instance should carry the config we attached in the mock
    // @ts-expect-error - test-only property
    expect(msalInstance._constructedWith).toBe(msalConfig);
  });
});
