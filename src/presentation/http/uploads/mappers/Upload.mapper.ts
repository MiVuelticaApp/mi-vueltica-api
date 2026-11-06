import { UploadedFile } from "@/application/uploads/services/interfaces/IUploadService";
import { UploadResponse } from "../responses/UploadResponse";

export default class UploadDtoMapper {
  static toResponse({ upload, url }: UploadedFile): UploadResponse {
    return {
      id: upload.id,
      url,
      contentType: upload.contentType,
      size: upload.size,
      width: upload.width,
      height: upload.height,
      createdAt: upload.createdAt.toISOString(),
    };
  }
}
