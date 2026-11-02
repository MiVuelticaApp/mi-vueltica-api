import z from "zod";
import { pushTokenField } from "@/presentation/http/devices/validators/registerDevice";

// The body is optional (Express 5 leaves req.body undefined when none is sent): logging out
// without it behaves as before. With `pushToken`, that device stops receiving notifications.
export const LogoutSchema = z
  .object({ pushToken: pushTokenField.optional() })
  .optional();
