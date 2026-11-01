import { Request, Response } from "express";
import { MinFrontendVersionResponse } from "../responses/MinFrontendVersionResponse";

export default class SystemController {
  constructor(private readonly minFrontendVersionValue: string) {}

  /** GET /system/min-frontend-version — public, callable before login. */
  async minFrontendVersion(_req: Request, res: Response): Promise<void> {
    const response: MinFrontendVersionResponse = {
      minVersion: this.minFrontendVersionValue,
    };
    res.status(200).json(response);
  }
}