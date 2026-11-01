import { Source } from "@/domain/sources/entities/Source";
import { SourceName } from "@/domain/sources/valueObjects/sourceName.valueObject";
import { SourceUrl } from "@/domain/sources/valueObjects/sourceUrl.valueObject";
import { parseSourceType } from "@/domain/sources/valueObjects/sourceType.valueObject";
import { ISourceRepository, SourceListFilters } from "@/domain/sources/repositories/ISourceRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { ISourceService, SourceInput, SourceUpdateInput } from "../interfaces/ISourceService";
import { SourceNotFoundError } from "../../errors/SourceNotFoundError";
import { SourceInUseError } from "../../errors/SourceInUseError";

export class SourceService implements ISourceService {
  constructor(private readonly sourceRepository: ISourceRepository) {}

  async list(params: PaginationParams, filters?: SourceListFilters): Promise<PaginatedResult<Source>> {
    return this.sourceRepository.list(params, filters);
  }

  async get(id: string): Promise<Source> {
    const source = await this.sourceRepository.find(id);
    if (!source) throw new SourceNotFoundError();
    return source;
  }

  async create(data: SourceInput): Promise<Source> {
    return this.sourceRepository.create({
      name: SourceName.create(data.name).value,
      url: SourceUrl.create(data.url).value,
      type: parseSourceType(data.type),
    });
  }

  async update(id: string, data: SourceUpdateInput): Promise<Source> {
    const source = await this.get(id);
    source.update({ name: data.name, url: data.url, type: data.type });
    if (data.lastCrawledAt !== undefined) source.setLastCrawledAt(data.lastCrawledAt);
    await this.sourceRepository.update(source);
    return this.get(id);
  }

  async delete(id: string): Promise<void> {
    await this.get(id);
    const usage = await this.sourceRepository.countUsages(id);
    if (usage.places > 0 || usage.events > 0) throw new SourceInUseError();
    await this.sourceRepository.delete(id);
  }

  async markCrawled(id: string, at: Date = new Date()): Promise<Source> {
    const source = await this.get(id);
    source.markCrawled(at);
    await this.sourceRepository.update(source);
    return this.get(id);
  }
}
