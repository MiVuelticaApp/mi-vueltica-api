import { Request, Response } from "express";
import { IUploadService } from "@/application/uploads/services/interfaces/IUploadService";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import UploadDtoMapper from "../mappers/Upload.mapper";

/** POST /uploads — any authenticated user. */
export default class UploadController {
  constructor(private readonly uploadService: IUploadService) {}

  async create(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    // `singleFileUpload` guarantees the file is present.
    const uploaded = await this.uploadService.upload(userId, req.file!.buffer);
    res.status(201).json(UploadDtoMapper.toResponse(uploaded));
  }
}
