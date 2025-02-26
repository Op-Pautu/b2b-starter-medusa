import { MiddlewareRoute } from "@medusajs/medusa"
import { adminCompaniesMiddlewares } from "./companies/middlewares"
import { adminQuotesMiddlewares } from "./quotes/middlewares"
import { adminOrderStatusMiddlewares } from "src/api/admin/order-status/middlewares"

export const adminMiddlewares: MiddlewareRoute[] = [
  ...adminCompaniesMiddlewares,
  ...adminQuotesMiddlewares,
  ...adminOrderStatusMiddlewares,
]
