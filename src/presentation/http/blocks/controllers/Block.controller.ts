import { Request, Response } from "express";
import { z } from "zod";
import { IBlockService } from "@/application/blocks/services/interfaces/IBlockService";
import { BlockTarget } from "@/domain/blocks/entities/BlockedUser";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ListBlocksQuerySchema } from "../validators/listBlocks";
import BlockDtoMapper from "../mappers/Block.mapper";

type ListQuery = z.output<typeof ListBlocksQuerySchema>;
type Handler = (req: Request, res: Response) => Promise<void>;

/** Path param that carries the target id in each block router. */
export const BLOCK_TARGET_PARAMS: Record<BlockTarget["type"], string> = { PLACE: "placeId", EVENT: "eventId", REVIEW: "reviewId" };

export default class BlockController {
  constructor(private readonly blockService: IBlockService) {}

  async list(req: Request, res: Response): Promise<void> {
    const { id } = getAuthUser(req);
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.blockService.list(id, toPaginationParams(query));
    res.json(toPaginatedResponse(result, BlockDtoMapper.toResponse));
  }

  async unblock(req: Request, res: Response): Promise<void> {
    const { id } = getAuthUser(req);
    const { id: blockId } = getValidated<{ id: string }>(req, "params");
    await this.blockService.unblock(id, blockId);
    res.status(204).send();
  }

  /** `POST` handler for `/places/:placeId/author/block`, `/events/:eventId/author/block` and `/reviews/:reviewId/author/block`. 204. */
  target(type: BlockTarget["type"]): { block: Handler } {
    return {
      block: async (req: Request, res: Response) => {
        const params = getValidated<Record<string, string>>(req, "params");
        await this.blockService.blockAuthor(getAuthUser(req).id, { type, id: params[BLOCK_TARGET_PARAMS[type]] });
        res.status(204).send();
      },
    };
  }
}
