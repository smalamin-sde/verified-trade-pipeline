import { createHash, createHmac } from 'crypto';

export const GENESIS_PREV_HASH = '0'.repeat(64);

export interface StoredLedgerEntry {
  type: string;
  payload: Record<string, unknown>;
  prevHash: string;
  thisHash: string;
  signature: string;
  signer: string;
  createdAt: Date;
}

export interface NewLedgerEntryInput {
  type: string;
  payload: Record<string, unknown>;
  signer: string;
  createdAt: Date;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value !== null && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function computeThisHash(
  input: NewLedgerEntryInput & { prevHash: string },
): string {
  return sha256Hex(
    canonicalJson({
      type: input.type,
      payload: input.payload,
      prevHash: input.prevHash,
      signer: input.signer,
      createdAt: input.createdAt.toISOString(),
    }),
  );
}

export function computePrevHashFromStoredEntry(entry: StoredLedgerEntry): string {
  return sha256Hex(
    canonicalJson({
      type: entry.type,
      payload: entry.payload,
      prevHash: entry.prevHash,
      thisHash: entry.thisHash,
      signature: entry.signature,
      signer: entry.signer,
      createdAt: entry.createdAt.toISOString(),
    }),
  );
}

export function signHash(thisHash: string, signingKey: string): string {
  return createHmac('sha256', signingKey).update(thisHash).digest('hex');
}

export function verifyEntrySignature(
  entry: StoredLedgerEntry,
  signingKey: string,
): boolean {
  return entry.signature === signHash(entry.thisHash, signingKey);
}

export function buildLedgerEntryFields(
  input: NewLedgerEntryInput,
  previousEntry: StoredLedgerEntry | null,
  signingKey: string,
): Pick<StoredLedgerEntry, 'prevHash' | 'thisHash' | 'signature'> {
  const prevHash = previousEntry
    ? computePrevHashFromStoredEntry(previousEntry)
    : GENESIS_PREV_HASH;

  const thisHash = computeThisHash({ ...input, prevHash });
  const signature = signHash(thisHash, signingKey);

  return { prevHash, thisHash, signature };
}

export function verifyChain(
  entries: StoredLedgerEntry[],
  signingKey: string,
): boolean {
  if (entries.length === 0) {
    return true;
  }

  let expectedPrevHash = GENESIS_PREV_HASH;

  for (const entry of entries) {
    if (entry.prevHash !== expectedPrevHash) {
      return false;
    }

    const recomputedThisHash = computeThisHash({
      type: entry.type,
      payload: entry.payload,
      prevHash: entry.prevHash,
      signer: entry.signer,
      createdAt: entry.createdAt,
    });

    if (entry.thisHash !== recomputedThisHash) {
      return false;
    }

    if (!verifyEntrySignature(entry, signingKey)) {
      return false;
    }

    expectedPrevHash = computePrevHashFromStoredEntry(entry);
  }

  return true;
}
