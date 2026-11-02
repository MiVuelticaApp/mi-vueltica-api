import { Province } from "@/domain/geography/entities/Province";
import { ProvinceListItem } from "@/domain/geography/entities/ProvinceListItem";
import { ProvinceResponse } from "../responses/ProvinceResponse";

export default class ProvinceDtoMapper {
  static toResponse(province: Province): ProvinceResponse {
    return { id: province.id, name: province.name };
  }

  static toListItemResponse(item: ProvinceListItem): ProvinceResponse {
    const response = ProvinceDtoMapper.toResponse(item.province);
    if (item.cantons) {
      response.cantons = item.cantons.map((canton) => ({ id: canton.id, name: canton.name }));
    }
    return response;
  }
}
