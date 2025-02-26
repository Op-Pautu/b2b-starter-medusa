import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import {
  AuthenticationInput,
  IAuthModuleService,
  ICustomerModuleService,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

import { MOBILE_OTP_MODULE } from "src/modules/mobile-otp"
import MobileOtpModuleService from "src/modules/mobile-otp/service"
import { verifyOTP } from "src/utils/otp"

type Input = {
  otpValue: string
  otpRecordId: string
  phone?: string
}
export const POST = async (req: MedusaRequest<Input>, res: MedusaResponse) => {
  const { otpValue, otpRecordId } = req.body

  if (!otpValue?.trim() || !otpRecordId?.trim()) {
    return res.status(400).json({
      success: false,
      message: "OTP and table ID are required",
    })
  }
  const mobileOtpService: MobileOtpModuleService =
    req.scope.resolve(MOBILE_OTP_MODULE)
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: otpRecord } = await query.graph({
      entity: "mobile_otp",
      fields: ["*"],
      filters: { id: otpRecordId },
    })

    if (!otpRecord?.length) {
      return res.status(404).json({
        success: false,
        message: "OTP record not found",
      })
    }

    const otpData = otpRecord[0]

    // Verify OTP hash
    if (!verifyOTP(otpValue, otpData.otp_hash)) {
      // Increment attempt count
      await mobileOtpService.updateMobileOtps({
        id: otpRecordId,
        attempt_count: otpData.attempt_count + 1,
        is_valid: otpData.attempt_count < 2,
      })
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      })
    }

    if (new Date(otpData.expires_at) < new Date() || !otpData.is_valid) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired or is no longer valid",
      })
    }

    const authService: IAuthModuleService = req.scope.resolve(Modules.AUTH)
    const customerService: ICustomerModuleService = req.scope.resolve(
      Modules.CUSTOMER
    )
    req.body.phone = otpData.phone

    const authResult = await authService.register("my-auth", {
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.body,
      protocol: req.protocol,
    } as AuthenticationInput)

    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        message: authResult.error,
      })
    }
    console.log("authResult", authResult)

    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["*"],
      filters: { phone: otpData.phone as any },
    })

    let customer = customers[0]

    if (!customer) {
      const newCustomer = await customerService.createCustomers({
        phone: otpData.phone,
        has_account: true,
      })

      if (!newCustomer) {
        return res
          .status(500)
          .json({ success: false, message: "Customer creation failed" })
      }

      // Fetch the full customer entity using its ID
      const { data: fetchedCustomers } = await query.graph({
        entity: "customer",
        fields: ["*"], // Fetch all fields
        filters: { id: newCustomer.id as any },
      })

      if (!fetchedCustomers?.length) {
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve full customer details",
        })
      }

      customer = fetchedCustomers[0]
      console.log("customer.phone", customer?.phone)
    }

    const { jwtSecret } = req.scope.resolve("configModule").projectConfig.http
    console.log({ jwtSecret })
    // Ensure jwtSecret exists
    if (!jwtSecret) {
      throw new Error("JWT secret is not configured")
    }

    const token = jwt.sign(
      {
        actor_id: customer.id,
        actor_type: "customer",
        auth_identity_id: authResult.authIdentity?.id || undefined,
        app_metadata: {
          customer_id: customer.id,
        },
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      },
      jwtSecret as string
    )

    // Invalidate the OTP after successful verification
    await mobileOtpService.updateMobileOtps({
      id: otpRecordId,
      is_valid: false,
    })
    console.log({ customer })
    return res.json({
      success: true,
      message: "OTP verified successfully",
      customer,
      token,
      error: authResult.error,
      authIdentityId: authResult.authIdentity?.id,
    })
  } catch (error) {
    console.error("Verify OTP Error:", error)
    return res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
