import { BlockedUser } from "@/domain/blocks/entities/BlockedUser";
import { BlockResponse } from "../responses/BlockResponse";

export default class BlockDtoMapper {
  static toResponse(block: BlockedUser): BlockResponse {
    return { id: block.id, name: block.name, createdAt: block.createdAt.toISOString() };
  }
}
