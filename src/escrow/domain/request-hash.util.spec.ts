import { computeRequestHash } from './request-hash.util';

describe('computeRequestHash', () => {
  it('is stable for the same trade and body', () => {
    const first = computeRequestHash('trade-1', {});
    const second = computeRequestHash('trade-1', {});

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  it('changes when trade id changes', () => {
    const first = computeRequestHash('trade-1', {});
    const second = computeRequestHash('trade-2', {});

    expect(first).not.toBe(second);
  });
});
