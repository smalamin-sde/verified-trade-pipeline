import {
  buildLedgerEntryFields,
  canonicalJson,
  computePrevHashFromStoredEntry,
  GENESIS_PREV_HASH,
  StoredLedgerEntry,
  verifyChain,
} from './hash-chain';

const SIGNING_KEY = 'test-passport-signing-key';

describe('hash-chain', () => {
  const createdAt = new Date('2026-08-08T12:00:00.000Z');

  function makeEntry(
    overrides: Partial<StoredLedgerEntry> = {},
  ): StoredLedgerEntry {
    const base = {
      type: 'AUTHENTICATED',
      payload: { tradeId: 'trade-1' },
      signer: 'authenticator@demo.com',
      createdAt,
      ...overrides,
    };

    const fields = buildLedgerEntryFields(
      {
        type: base.type,
        payload: base.payload,
        signer: base.signer,
        createdAt: base.createdAt,
      },
      overrides.prevHash === undefined && overrides.thisHash === undefined
        ? null
        : null,
      SIGNING_KEY,
    );

    return {
      prevHash: overrides.prevHash ?? fields.prevHash,
      thisHash: overrides.thisHash ?? fields.thisHash,
      signature: overrides.signature ?? fields.signature,
      type: base.type,
      payload: base.payload,
      signer: base.signer,
      createdAt: base.createdAt,
    };
  }

  it('produces stable canonical JSON regardless of key order', () => {
    const a = canonicalJson({ b: 2, a: 1, nested: { z: 9, y: 8 } });
    const b = canonicalJson({ nested: { y: 8, z: 9 }, a: 1, b: 2 });

    expect(a).toBe(b);
  });

  it('links genesis entry to GENESIS_PREV_HASH', () => {
    const fields = buildLedgerEntryFields(
      {
        type: 'AUTHENTICATED',
        payload: { tradeId: 't1' },
        signer: 'auth',
        createdAt,
      },
      null,
      SIGNING_KEY,
    );

    expect(fields.prevHash).toBe(GENESIS_PREV_HASH);
    expect(fields.thisHash).toHaveLength(64);
    expect(fields.signature).toHaveLength(64);
  });

  it('verifies a two-entry chain', () => {
    const first = makeEntry();
    const secondFields = buildLedgerEntryFields(
      {
        type: 'TRANSFERRED',
        payload: { buyerId: 'buyer-1' },
        signer: 'system',
        createdAt: new Date('2026-08-08T13:00:00.000Z'),
      },
      first,
      SIGNING_KEY,
    );

    const second: StoredLedgerEntry = {
      type: 'TRANSFERRED',
      payload: { buyerId: 'buyer-1' },
      signer: 'system',
      createdAt: new Date('2026-08-08T13:00:00.000Z'),
      ...secondFields,
    };

    expect(second.prevHash).toBe(computePrevHashFromStoredEntry(first));
    expect(verifyChain([first, second], SIGNING_KEY)).toBe(true);
  });

  it('returns verified=false when an entry is tampered', () => {
    const entry = makeEntry();
    entry.payload = { tradeId: 'tampered' };

    expect(verifyChain([entry], SIGNING_KEY)).toBe(false);
  });
});
