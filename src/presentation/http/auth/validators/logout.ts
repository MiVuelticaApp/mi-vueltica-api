import z from "zod";
import { pushTokenField } from "@/presentation/http/devices/validators/registerDevice";

// The body is optional (Express 5 leaves req.body undefined when none is sent): logging out
// without it behaves as before. With `pushToken`, that device stops receiving notifications.
export const LogoutBodySchema = z.object({ pushToken: pushTokenField.optional() });

export const LogoutSchema = LogoutBodySchema.optional();
