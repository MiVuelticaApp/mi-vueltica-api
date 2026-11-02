/**
 * The single `COMMUNITY` source that every approved community submission is attributed to.
 * Its id is fixed (not generated) so the seed can create it idempotently and the approval
 * flow can find it without a lookup by name. Created by `src/infrastructure/prisma/seed/seed.ts`.
 */
export const COMMUNITY_SOURCE_ID = "00000000-0000-4000-8000-000000000001";
export const COMMUNITY_SOURCE_NAME = "Comunidad";
