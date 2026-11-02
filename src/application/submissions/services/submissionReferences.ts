import { SubmissionPayload } from "@/domain/submissions/entities/SubmissionPayload";
import { IPlaceRepository } from "@/domain/places/repositories/IPlaceRepository";
import { ICategoryRepository } from "@/domain/categories/repositories/ICategoryRepository";
import { InvalidCantonError } from "@/application/places/errors/InvalidCantonError";
import { InvalidCategoryError } from "@/application/places/errors/InvalidCategoryError";
import { InvalidPlaceError } from "@/application/events/errors/InvalidPlaceError";

export interface SubmissionReferenceRepositories {
  placeRepository: IPlaceRepository;
  categoryRepository: ICategoryRepository;
}

/**
 * Same reference checks as creating a Place/Event (422 on unknown canton, category or place).
 * Runs when the submission is created and again inside the approval transaction, since a
 * referenced row may have been deleted in between.
 */
export async function ensureSubmissionReferencesExist(
  payload: SubmissionPayload,
  { placeRepository, categoryRepository }: SubmissionReferenceRepositories,
): Promise<void> {
  if (payload.type === "PLACE") {
    if (!(await placeRepository.cantonExists(payload.data.cantonId))) throw new InvalidCantonError();
  } else if (payload.data.placeId && !(await placeRepository.find(payload.data.placeId))) {
    throw new InvalidPlaceError();
  }
  if (!(await categoryRepository.find(payload.data.categoryId))) throw new InvalidCategoryError();
}
