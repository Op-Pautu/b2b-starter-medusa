import { validateAndTransformBody } from "@medusajs/framework";
import { updateOrderStatusSchema } from "src/api/admin/order-status/validators";
import { MiddlewareRoute } from "@medusajs/medusa";

export const adminOrderStatusMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/order-status",
    middlewares: [
      validateAndTransformBody(updateOrderStatusSchema),
    ],
  },
];