import { describe, expect, it } from "vitest";
import {
  createPendingAssetProducerKey,
  GenerationPendingAssetRegistry,
} from "./generationPendingAssetRegistry";

describe("GenerationPendingAssetRegistry", () => {
  it("keeps previous-generation work pending until its own completion", () => {
    const registry = new GenerationPendingAssetRegistry();
    const recordA = createPendingAssetProducerKey();
    const recordB = createPendingAssetProducerKey();

    expect(
      registry.update({
        count: 1,
        generation: "record-a",
        producerKey: recordA,
      }),
    ).toBe(1);
    expect(
      registry.update({
        count: 2,
        generation: "record-b",
        producerKey: recordB,
      }),
    ).toBe(3);
    expect(
      registry.update({
        count: 0,
        generation: "record-a",
        producerKey: recordA,
      }),
    ).toBe(2);
    expect(
      registry.update({
        count: 0,
        generation: "record-b",
        producerKey: recordB,
      }),
    ).toBe(0);
  });

  it("keeps overlapping same-generation producers independent", () => {
    const registry = new GenerationPendingAssetRegistry();
    const oldProducer = createPendingAssetProducerKey();
    const newProducer = createPendingAssetProducerKey();

    expect(
      registry.update({
        count: 1,
        generation: "same-record",
        producerKey: oldProducer,
      }),
    ).toBe(1);
    expect(
      registry.update({
        count: 1,
        generation: "same-record",
        producerKey: newProducer,
      }),
    ).toBe(2);
    expect(
      registry.update({
        count: 0,
        generation: "same-record",
        producerKey: oldProducer,
      }),
    ).toBe(1);
    expect(
      registry.update({
        count: 0,
        generation: "same-record",
        producerKey: newProducer,
      }),
    ).toBe(0);
  });

  it("normalizes invalid counts without producing negative pending work", () => {
    const registry = new GenerationPendingAssetRegistry();
    const producerKey = createPendingAssetProducerKey();
    expect(
      registry.update({
        count: -4,
        generation: "record-a",
        producerKey,
      }),
    ).toBe(0);
    expect(
      registry.update({
        count: Number.NaN,
        generation: "record-a",
        producerKey,
      }),
    ).toBe(0);
  });
});
