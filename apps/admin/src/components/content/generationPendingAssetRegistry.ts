export type PendingAssetProducerKey = symbol;

/**
 * Absolute unfinished-work count reported by one mounted asset producer.
 * `producerKey` distinguishes overlapping editor instances for the same
 * generation, so a stale producer cannot clear a newer producer's work.
 */
export type PendingAssetWork = {
  readonly count: number;
  readonly generation: string;
  readonly producerKey: PendingAssetProducerKey;
};

export function createPendingAssetProducerKey(): PendingAssetProducerKey {
  return Symbol("pending-asset-producer");
}

/** Keeps every producer busy until its upload and cleanup really finish. */
export class GenerationPendingAssetRegistry {
  private readonly counts = new Map<PendingAssetProducerKey, number>();

  update(event: PendingAssetWork): number {
    const count = Number.isFinite(event.count)
      ? Math.max(0, Math.trunc(event.count))
      : 0;
    if (count === 0) this.counts.delete(event.producerKey);
    else this.counts.set(event.producerKey, count);
    return this.total();
  }

  total(): number {
    let total = 0;
    for (const count of this.counts.values()) total += count;
    return total;
  }
}
