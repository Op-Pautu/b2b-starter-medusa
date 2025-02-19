import { Module } from "@medusajs/framework/utils"
import MobileOtpModuleService from "./service"

export const MOBILE_OTP_MODULE = "mobile_otp"

export default Module(MOBILE_OTP_MODULE, {
  service: MobileOtpModuleService,
})
