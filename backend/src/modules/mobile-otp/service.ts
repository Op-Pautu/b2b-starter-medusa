import { MedusaService } from "@medusajs/framework/utils"
import { MobileOtp } from "src/modules/mobile-otp/models/mobile-otp"

class MobileOtpModuleService extends MedusaService({
  MobileOtp,
}) {}

export default MobileOtpModuleService
