import z from "zod";

export const NotificationSettingsSchema = z.object({
  reminders: z.boolean({ message: "reminders debe ser true o false" }),
  newNearby: z.boolean({ message: "newNearby debe ser true o false" }),
  myStatus: z.boolean({ message: "myStatus debe ser true o false" }),
});
