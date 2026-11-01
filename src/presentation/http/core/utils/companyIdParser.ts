import { Request } from "express";

export default function CompanyIdParser(req: Request) : string {
  const companyId = req.headers["x-company-id"];
  return companyId as string; // since is checked on middleware
}
  