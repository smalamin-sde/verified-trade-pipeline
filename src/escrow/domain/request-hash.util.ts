import { createHash } from 'crypto';
import { canonicalJson } from '../../passport/domain/hash-chain';

export function computeRequestHash(
  tradeId: string,
  body: Record<string, unknown>,
): string {
  return createHash('sha256')
    .update(canonicalJson({ tradeId, ...body }))
    .digest('hex');
}
