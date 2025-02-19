import { model } from "@medusajs/framework/utils"
import { InferTypeOf } from "@medusajs/framework/types"

export const MobileOtp = model.define("mobile_otp", {
  id: model.id().primaryKey(),
  phone: model.text().unique(),
  attempt_count: model.number().default(0),
  otp_hash: model.text(),
  expires_at: model.dateTime(),
  is_valid: model.boolean().default(true),
})

export type MobileOtp = InferTypeOf<typeof MobileOtp>
