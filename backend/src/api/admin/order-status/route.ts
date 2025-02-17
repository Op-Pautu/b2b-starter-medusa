import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { updateOrderStatusSchema } from "./validators";

// Define the allowed statuses
const allowedStatuses = ["pending", "completed", "canceled"];

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  // Validate the request body
  const validationResult = updateOrderStatusSchema.safeParse(req.validatedBody);
  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.errors });
  }

  const { orderId, status } = validationResult.data;

  // Validate the status
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const orderService = req.scope.resolve(Modules.ORDER);

  // Update the order status
  try {
    const updatedOrder = await orderService.updateOrders(orderId, { status });
    return res.json({ order: updatedOrder });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update order status" });
  }
};
