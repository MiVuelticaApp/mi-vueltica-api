import { randomUUID } from "crypto";
import { IIDGenerator } from "@/domain/core/services/IIDGenerator";

/**
 * Random (v4) UUIDs: 122 random bits and no embedded timestamp. Used where the id is also a
 * capability, e.g. upload ids in public file URLs, which must not be guessable.
 */
export default class RandomUuidIDGenerator implements IIDGenerator {
  generate(): string {
    return randomUUID();
  }
}
