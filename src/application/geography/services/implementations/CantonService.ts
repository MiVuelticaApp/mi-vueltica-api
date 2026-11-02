import { Canton } from "@/domain/geography/entities/Canton";
import { ICantonRepository } from "@/domain/geography/repositories/ICantonRepository";
import { IProvinceRepository } from "@/domain/geography/repositories/IProvinceRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { CreateCantonInput, ICantonService } from "../interfaces/ICantonService";
import { CantonNotFoundError } from "../../errors/CantonNotFoundError";
import { CantonAlreadyExistsError } from "../../errors/CantonAlreadyExistsError";
import { CantonInUseError } from "../../errors/CantonInUseError";
import { InvalidProvinceError } from "../../errors/InvalidProvinceError";
import { ProvinceNotFoundError } from "../../errors/ProvinceNotFoundError";

export class CantonService implements ICantonService {
  constructor(
    private readonly cantonRepository: ICantonRepository,
    private readonly provinceRepository: IProvinceRepository,
  ) {}

  async listByProvince(provinceId: number, params: PaginationParams): Promise<PaginatedResult<Canton>> {
    // The province is in the URL, so a missing one is a 404 (not an empty list).
    if (!(await this.provinceRepository.find(provinceId))) throw new ProvinceNotFoundError();
    return this.cantonRepository.listByProvince(provinceId, params);
  }

  async get(id: number): Promise<Canton> {
    const canton = await this.cantonRepository.find(id);
    if (!canton) throw new CantonNotFoundError();
    return canton;
  }

  async create(input: CreateCantonInput): Promise<Canton> {
    // Building the entity first validates the INEC id and the name (400) before touching the DB.
    const canton = new Canton(input);

    // The province is in the body, so a missing one is a 422.
    if (!(await this.provinceRepository.find(canton.provinceId))) throw new InvalidProvinceError();
    if (await this.cantonRepository.find(canton.id)) {
      throw CantonAlreadyExistsError.withId(canton.id);
    }
    if (await this.cantonRepository.findByName(canton.provinceId, canton.name)) {
      throw CantonAlreadyExistsError.withName();
    }

    // A concurrent insert can still slip past these checks; the DB unique constraints
    // reject it (P2002) and the error handler maps that to 409 as well.
    return this.cantonRepository.create(canton);
  }

  async update(id: number, name: string): Promise<Canton> {
    const canton = await this.get(id);
    canton.rename(name);

    const existing = await this.cantonRepository.findByName(canton.provinceId, canton.name);
    if (existing && existing.id !== id) throw CantonAlreadyExistsError.withName();

    await this.cantonRepository.update(canton);
    return this.get(id);
  }

  async delete(id: number): Promise<void> {
    await this.get(id);
    // Place.cantonId is ON DELETE RESTRICT: check first to return a clear 409.
    if (await this.cantonRepository.countPlaces(id) > 0) throw new CantonInUseError();
    await this.cantonRepository.delete(id);
  }
}
