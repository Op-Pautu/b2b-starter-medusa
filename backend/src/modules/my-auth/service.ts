import {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse,
} from "@medusajs/framework/types"
import {
  AbstractAuthModuleProvider,
  MedusaError,
} from "@medusajs/framework/utils"

class MyAuthProviderService extends AbstractAuthModuleProvider {
  static identifier = "my-auth"
  static DISPLAY_NAME = "Mobile OTP Authentication"
  // TODO implement methods
  async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    if (!data.body || !data.body.phone || !data.body.otp) {
      return {
        success: false,
        error: "Invalid request body, please provide phone number and OTP.",
      }
    }
    const { phone, otp } = data.body
    // const otp = data.body.otp;
    // const otpTableId = data.body.otpTableId;
    // if (!otp) {
    //   return {
    //     success: false,
    //     error: "Invalid request body please provide otp",
    //   };
    // }
    // if (!otpTableId) {
    //   return {
    //     success: false,
    //     error: "Invalid request body please provide otpTableId",
    //   };
    // }
    // const mobileOtpService: MobileOtpModuleService =
    //   req.scope.resolve(MOBILE_OTP_MODULE);

    const authIdentity = await authIdentityProviderService.retrieve({
      entity_id: phone,
      // provider: this.provider,
    })
    return {
      success: true,
      authIdentity,
    }
  }

  async register(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    if (!data.body) {
      return {
        success: false,
        error: "Invalid request body please provide phone number",
      }
    }
    console.log("data.body", data.body)
    try {
      await authIdentityProviderService.retrieve({
        entity_id: data.body.phone, // email or some ID
      })
      return {
        success: false,
        error: "Identity with phone number already exists",
      }
    } catch (error) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        const createdAuthIdentity = await authIdentityProviderService.create({
          entity_id: data.body.phone, // email or some ID
        })
        console.log("createdAuthIdentity", createdAuthIdentity)
        return {
          success: true,
          authIdentity: createdAuthIdentity,
        }
      }
      return { success: false, error: error.message }
    }
  }
}

export default MyAuthProviderService
