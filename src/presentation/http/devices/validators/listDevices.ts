import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";
import { DEVICE_SORT_FIELDS } from "@/domain/devices/repositories/IDeviceRepository";

export { DEVICE_SORT_FIELDS };

/** GET /me/devices — the caller's devices, most recently registered first by default. */
export const ListDevicesQuerySchema = createPaginationQuerySchema(DEVICE_SORT_FIELDS);
