import { IIDGenerator } from "@/domain/core/services/IIDGenerator";
import { v7 } from "uuid";

export default class UuidIDGenerator implements IIDGenerator  {

    constructor() {}

    generate(): string {
        return v7();
    }
}