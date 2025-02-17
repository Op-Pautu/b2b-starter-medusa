import { IOrderModuleService } from "@medusajs/framework/types";
import {
  getSelectsAndRelationsFromObjectArray,
  ContainerRegistrationKeys,
  convertItemResponseToUpdateRequest,
  Modules,
} from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  createOrderFulfillmentWorkflow,
  markPaymentCollectionAsPaid,
} from "@medusajs/medusa/core-flows";

/*
  A step to update the order. This is being used in the update order workflow.
  The first function attempts to update the order, while the second function attempts to revert
  the update incase the workflow fails. The first function is also preparing the data to be reverted
  when a failure is triggered.
*/
export const updateOrderStep = createStep(
  "update-order",
  async (
    data: {
      id: string;
      is_draft_order: boolean;
      status: string;
    },
    { container }
  ) => {
    const { id, ...rest } = data;
    const orderModule: IOrderModuleService = container.resolve(Modules.ORDER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // Get the original data for revert functionality
    const { selects, relations } = getSelectsAndRelationsFromObjectArray([
      data,
    ]);
    const dataBeforeUpdate = await orderModule.listOrders(
      { id: data.id },
      { relations, select: selects }
    );

    // Get order with payment collections and items using query graph
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "payment_collections.id",
        "items.id",
        "items.quantity",
        "items.*",
      ],
      filters: { id: data.id },
    });

    // Check if order is null or undefined
    if (!order) {
      throw new Error(`Order with id ${data.id} not found`);
    }

    const updatedOrder = await orderModule.updateOrders(id, {
      ...rest,
      payment_status: "captured",
      fulfillment_status: "fulfilled",
    } as any);

    // Handle payment collection if it exists
    if (order.payment_collections?.[0]) {
      await markPaymentCollectionAsPaid(container).run({
        input: {
          order_id: order.id,
          payment_collection_id: order.payment_collections[0].id,
        },
      });
    }
    console.log("Order Details:", JSON.stringify(order, null, 2)); // Pretty print the order object

    // Create fulfillment using the createOrderFulfillmentWorkflow
    if (order.items?.length) {
      const items = order.items
        .map((item) => {
          // Ensure item is not null and has a valid quantity
          if (item && item.quantity !== undefined) {
            console.log(`Item ID: ${item.id}, Quantity: ${item.quantity}`); // Log item details
            return {
              id: item.id,
              quantity: item.quantity, // Use item.quantity directly
            };
          } else {
            console.warn(
              `Item ID: ${item?.id} has an invalid quantity: ${item?.quantity}`
            );
          }
          return null; // Return null for invalid items
        })
        .filter(
          (item): item is { id: string; quantity: number } => item !== null
        ); // Filter out null items

      // Only run the fulfillment workflow if there are valid items
      console.log({ items });
      if (items.length > 0) {
        await createOrderFulfillmentWorkflow(container)
          .run({
            input: {
              order_id: order.id,
              items: items,
            },
          })
          .catch((err) => {
            console.log({ err });
          });
      } else {
        console.warn("No valid items found for fulfillment.");
      }
    }

    return new StepResponse(updatedOrder, {
      dataBeforeUpdate,
      selects,
      relations,
    });
  },
  async (revertInput, { container }) => {
    if (!revertInput) {
      return;
    }

    const { dataBeforeUpdate, selects, relations } = revertInput;
    const orderModule: any = container.resolve(Modules.ORDER);

    await orderModule.updateOrder(
      dataBeforeUpdate.map((data) =>
        convertItemResponseToUpdateRequest(data, selects, relations)
      )
    );
  }
);
