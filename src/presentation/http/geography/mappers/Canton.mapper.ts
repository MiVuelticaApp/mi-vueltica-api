import { Canton } from "@/domain/geography/entities/Canton";
import { CantonResponse } from "../responses/CantonResponse";

export default class CantonDtoMapper {
  static toResponse(canton: Canton): CantonResponse {
    return { id: canton.id, provinceId: canton.provinceId, name: canton.name };
  }
}
