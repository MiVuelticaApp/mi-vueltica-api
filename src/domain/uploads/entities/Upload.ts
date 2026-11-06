/**
 * A file stored in object storage (SeaweedFS). The API proxies it at `GET /api/v1/files/:id`;
 * clients never talk to the storage directly. Files are immutable: a new picture is a new upload.
 */
export class Upload {
  constructor(private readonly props: UploadProps) {}

  get id() { return this.props.id; }
  /** Null once the uploader deleted their account. */
  get userId() { return this.props.userId; }
  get objectKey() { return this.props.objectKey; }
  get contentType() { return this.props.contentType; }
  get size() { return this.props.size; }
  get width() { return this.props.width; }
  get height() { return this.props.height; }
  get createdAt() { return this.props.createdAt; }

  belongsTo(userId: string) { return this.props.userId === userId; }
}

export interface UploadProps {
  id: string;
  userId: string | null;
  objectKey: string;
  contentType: string;
  size: number;
  width: number;
  height: number;
  createdAt: Date;
}

/**
 * Object key of an upload in the bucket. Derived from the id alone so serving a file never
 * needs a database lookup.
 */
export function uploadObjectKey(uploadId: string): string {
  return `uploads/${uploadId}`;
}
