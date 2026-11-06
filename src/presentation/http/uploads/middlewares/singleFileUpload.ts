import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { UPLOAD_FIELD_NAME, UPLOAD_MAX_BYTES } from "../uploadLimits";

// In memory: files are small (UPLOAD_MAX_BYTES) and go straight to the image processor and
// then to the object storage, so nothing ever touches the local disk.
const parseSingleFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_MAX_BYTES, files: 1, fields: 5, parts: 6 },
}).single(UPLOAD_FIELD_NAME);

const MISSING_FILE = `Envía la imagen como multipart/form-data en el campo "${UPLOAD_FIELD_NAME}"`;

/**
 * Parses a multipart body with exactly one file in the `file` field into `req.file`.
 * Too large → 413; missing file, other file fields or a malformed body → 400.
 */
export default function singleFileUpload(req: Request, res: Response, next: NextFunction) {
  parseSingleFile(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ message: `La imagen no puede exceder ${UPLOAD_MAX_BYTES / (1024 * 1024)} MB` });
        return;
      }
      res.status(400).json({ message: MISSING_FILE });
      return;
    }
    if (error) {
      // Malformed multipart (e.g. truncated body) from busboy.
      res.status(400).json({ message: MISSING_FILE });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: MISSING_FILE });
      return;
    }
    next();
  });
}
