import { Province } from "@/domain/geography/entities/Province";
import { ProvinceListItem } from "@/domain/geography/entities/ProvinceListItem";
import { Province as PrismaProvince } from "@/infrastructure/prisma/generated/prisma/client";

/** A province row, with its cantons only when the query included them. */
export type PrismaProvinceListRow = PrismaProvince & {
  cantons?: { id: number; name: string }[];
};

export class PrismaProvinceMapper {
  static toDomain(row: PrismaProvince): Province {
    return new Province({ id: row.id, name: row.name });
  }

  static toListItem(row: PrismaProvinceListRow): ProvinceListItem {
    const item: ProvinceListItem = { province: PrismaProvinceMapper.toDomain(row) };
    if (row.cantons) {
      item.cantons = row.cantons.map((canton) => ({ id: canton.id, name: canton.name }));
    }
    return item;
  }
}
