/** One entry of "Personas bloqueadas". `id` is the block's id (`DELETE /me/blocks/:id`). */
export interface BlockResponse {
  id: string;
  /** The blocked person's first name. */
  name: string;
  createdAt: string;
}
