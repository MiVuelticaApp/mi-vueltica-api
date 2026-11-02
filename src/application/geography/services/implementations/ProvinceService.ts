import { Province } from "@/domain/geography/entities/Province";
import { ProvinceListItem } from "@/domain/geography/entities/ProvinceListItem";
import { IProvinceRepository, ProvinceListOptions } from "@/domain/geography/repositories/IProvinceRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { CreateProvinceInput, IProvinceService } from "../interfaces/IProvinceService";
import { ProvinceNotFoundError } from "../../errors/ProvinceNotFoundError";
import { ProvinceAlreadyExistsError } from "../../errors/ProvinceAlreadyExistsError";
import { ProvinceInUseError } from "../../errors/ProvinceInUseError";

export class ProvinceService implements IProvinceService {
  constructor(private readonly provinceRepository: IProvinceRepository) {}

  async list(params: PaginationParams, options?: ProvinceListOptions): Promise<PaginatedResult<ProvinceListItem>> {
    return this.provinceRepository.list(params, options);
  }

  async get(id: number): Promise<Province> {
    const province = await this.provinceRepository.find(id);
    if (!province) throw new ProvinceNotFoundError();
    return province;
  }

  async create(input: CreateProvinceInput): Promise<Province> {
    // Building the entity first validates the name (400) before touching the DB.
    const province = new Province(input);

    if (await this.provinceRepository.find(province.id)) {
      throw ProvinceAlreadyExistsError.withId(province.id);
    }
    if (await this.provinceRepository.findByName(province.name)) {
      throw ProvinceAlreadyExistsError.withName();
    }

    // A concurrent insert can still slip past these checks; the DB unique constraints
    // reject it (P2002) and the error handler maps that to 409 as well.
    return this.provinceRepository.create(province);
  }

  async update(id: number, name: string): Promise<Province> {
    const province = await this.get(id);
    province.rename(name);

    const existing = await this.provinceRepository.findByName(province.name);
    if (existing && existing.id !== id) throw ProvinceAlreadyExistsError.withName();

    await this.provinceRepository.update(province);
    return province;
  }

  async delete(id: number): Promise<void> {
    await this.get(id);
    // Canton.provinceId is ON DELETE RESTRICT: check first to return a clear 409.
    if (await this.provinceRepository.countCantons(id) > 0) throw new ProvinceInUseError();
    await this.provinceRepository.delete(id);
  }
}
