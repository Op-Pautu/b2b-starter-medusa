import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["pending", "completed", "canceled"]),
});
