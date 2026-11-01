import { PaginatedResult, PaginationParams, SortDirection } from "@/domain/core/pagination/Pagination";
import { Prisma, PrismaClient } from "@/infrastructure/prisma/generated/prisma/client";

export interface PrismaPage {
  skip: number;
  take: number;
  orderBy?: Record<string, SortDirection>;
}

/** Translates domain pagination params into Prisma `skip` / `take` / `orderBy`. */
export function toPrismaPage(params: PaginationParams): PrismaPage {
  return {
    skip: (params.page - 1) * params.pageSize,
    take: params.pageSize,
    orderBy: params.sort ? { [params.sort.field]: params.sort.direction } : undefined,
  };
}

/**
 * Runs a paginated `findMany` plus its `count` and maps rows to domain entities.
 * On the root client both queries run in one transaction so `total` matches `items`;
 * on a transaction client they run directly on it.
 */
export async function paginate<TRow, TEntity>(
  client: PrismaClient | Prisma.TransactionClient,
  params: PaginationParams,
  run: {
    findMany: (tx: Prisma.TransactionClient, args: PrismaPage) => Promise<TRow[]>;
    count: (tx: Prisma.TransactionClient) => Promise<number>;
  },
  toDomain: (row: TRow) => TEntity,
): Promise<PaginatedResult<TEntity>> {
  const page = toPrismaPage(params);
  const execute = async (tx: Prisma.TransactionClient) => {
    const rows = await run.findMany(tx, page);
    const total = await run.count(tx);
    return { rows, total };
  };

  const { rows, total } =
    "$transaction" in client ? await client.$transaction((tx) => execute(tx)) : await execute(client);

  return {
    items: rows.map(toDomain),
    page: params.page,
    pageSize: params.pageSize,
    total,
  };
}
