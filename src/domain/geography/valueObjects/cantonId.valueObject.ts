import DataException from "@/domain/core/errors/DataError";

/**
 * INEC canton code: `provinceId * 100 + cantonNumber`, with cantonNumber 1-99
 * (e.g. 101 = San José, 216 = Río Cuarto). The province is encoded in the id, so a canton
 * can never move to another province without changing its id.
 */
export function assertCantonIdMatchesProvince(id: number, provinceId: number): void {
  const cantonNumber = id - provinceId * 100;
  if (!Number.isInteger(id) || cantonNumber < 1 || cantonNumber > 99) {
    throw new DataException(
      `El id del cantón debe ser el código INEC: provinceId × 100 + número de cantón (de ${provinceId * 100 + 1} a ${provinceId * 100 + 99} para la provincia ${provinceId})`,
    );
  }
}
