import { MobileOtp } from ".medusa/types/query-entry-points"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MOBILE_OTP_MODULE } from "src/modules/mobile-otp"
import MobileOtpModuleService from "src/modules/mobile-otp/service"
import { generateOTP, hashOTP } from "src/utils/otp"
// import VerifiedModuleService from "src/modules/verified/service";
// import { VERIFIED_MODULE } from "src/modules/verified";

const ExpirationTime = 10 * 60000 // 1 minute
type Input = {
  phone: string
}
export async function POST(req: MedusaRequest<Input>, res: MedusaResponse) {
  const phone = req.body.phone?.trim()

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required",
    })
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const mobileOtpService: MobileOtpModuleService =
      req.scope.resolve(MOBILE_OTP_MODULE)

    const otp = generateOTP()
    const otpHash = hashOTP(otp)
    const expiresAt = new Date(Date.now() + ExpirationTime)

    const { data: existingOtp } = await query.graph({
      entity: "mobile_otp",
      fields: ["*"],
      filters: { phone },
    })

    let mobileOtpTable: MobileOtp

    if (existingOtp.length === 0) {
      mobileOtpTable = await mobileOtpService.createMobileOtps({
        phone,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempt_count: 0,
        is_valid: true,
      })
    } else {
      mobileOtpTable = await mobileOtpService.updateMobileOtps({
        id: existingOtp[0].id,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempt_count: 0,
        is_valid: true,
      })
    }

    // TODO: Implement actual OTP sending here
    // await sendOTP(phone, otp);

    return res.json({
      success: true,
      message: `OTP sent to ${phone}`,
      mobileOtpTable,
      otp, // Remove in production
    })
  } catch (error) {
    console.error("Register OTP Error:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
