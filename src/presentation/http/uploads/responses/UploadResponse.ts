export interface UploadResponse {
  id: string;
  /** Durable URL to send back in `data.photos` (submissions) or `POST /places/:id/photos`. */
  url: string;
  /** Always `image/jpeg`: every upload is re-encoded. */
  contentType: string;
  /** Stored size in bytes (after re-encoding). */
  size: number;
  width: number;
  height: number;
  createdAt: string;
}
