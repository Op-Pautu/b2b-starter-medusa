"use client"

import { otpVerify, sendOtp } from "@lib/data/customer"
import { Text } from "@medusajs/ui"

import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Button from "@modules/common/components/button"
import Input from "@modules/common/components/input"
import { useActionState, useEffect, useState, } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}



const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(sendOtp, null)
  const [validationMessage, validationFormAction] = useActionState(otpVerify, null);

  const [currentStep, setCurrentStep] = useState(1);

  const [otpTableId, setOtpTableId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  useEffect(() => {
    if (message?.success && message.mobileOtpTable) {
      setOtpTableId(message.mobileOtpTable.id);
      // Clear OTP input when moving to step 2
      // setOtpValue("");
      setCurrentStep(2);
    }
  }, [message]);

  const renderPhoneStep = () => {
    return (
      <div
        className="max-w-sm flex flex-col items-start gap-2 my-4"
        data-testid="register-page"
      >
        <form className="w-full flex flex-col" action={formAction}>
          <div className="flex flex-col w-full gap-y-4">
            <Input
              label="Phone Number"
              name="phone_number"
              required
              onChange={(e) => setPhoneNumber(e.target.value)}
              pattern="[0-9]*"
              autoComplete="phone-number"
              data-testid="phone-number-input"
              className="bg-white"
            />
            <Input
              label="Company name"
              name="company_name"
              required
              onChange={(e) => setCompanyName(e.target.value)}
              autoComplete="organization"
              data-testid="company-name-input"
              className="bg-white"
            />
            <Input
              label="Company address"
              name="company_address"
              required
              autoComplete="address"
              onChange={(e) => setCompanyAddress(e.target.value)}
              data-testid="company-address-input"
              className="bg-white"
            />
          </div>
          <SubmitButton className="w-full mt-6">
            Send OTP
          </SubmitButton>
          <div className="border-b border-neutral-200 my-6" />
          <ErrorMessage error={message?.error} data-testid="send-error" />
        </form>
      </div>
    )
  }

  const renderOtpStep = () => {
    return (
      <form className="w-full flex flex-col" action={validationFormAction}>
        <div className="flex flex-col w-full gap-y-4">
          <Input
            label="Enter OTP"
            name="otp_value"
            type="text"
            pattern="[0-9]*"
            maxLength={4}
            required
            value={otpValue}
            onChange={(e) => setOtpValue(e.target.value)}
            title="Enter the 4-digit OTP"
          />
          {/* Hidden inputs */}
          <input
            type="hidden"
            name="otp_record_id"
            value={otpTableId || ''}
          />
          <input
            type="hidden"
            name="phone_number"
            value={phoneNumber}
          />
          <input type="hidden" name="company_name" value={companyName} />
          <input type="hidden" name="company_address" value={companyAddress} />
          <Text className="text-sm text-neutral-700">
            OTP sent to {phoneNumber}
          </Text>
        </div>
        <ErrorMessage error={validationMessage?.error} />
        <div className="flex flex-col gap-2">
          <SubmitButton className="w-full mt-6">
            Verify OTP
          </SubmitButton>
          <Button
            variant="secondary"
            onClick={() => {
              setOtpValue(""); // Clear OTP when going back
              setCurrentStep(1);
            }}
            className="w-full h-10"
          >
            Back to Phone Entry
          </Button>
        </div>
      </form>
    )
  }
  // const renderCustomerStep = () => {
  //   return (
  //     <form className="w-full flex flex-col" action={validationFormAction}>
  //       <div className="flex flex-col w-full gap-y-4">
  //         <Input
  //           label="Company name"
  //           name="company_name"
  //           required
  //           autoComplete="organization"
  //           data-testid="company-name-input"
  //           className="bg-white"
  //         />
  //         <Input
  //           label="Company address"
  //           name="company_address"
  //           required
  //           autoComplete="address"
  //           data-testid="company-address-input"
  //           className="bg-white"
  //         />
  //       </div>
  //       <SubmitButton className="w-full mt-6">
  //         Verify OTP
  //       </SubmitButton>
  //       <div className="border-b border-neutral-200 my-6" />
  //       <ErrorMessage error={validationMessage?.error} data-testid="verify-error" />
  //     </form>
  //   )
  // }
  return (
    <div
      className="max-w-sm w-full h-full flex flex-col justify-center gap-6 my-auto"
      data-testid="login-page"
    >
      <Text className="text-4xl text-neutral-950 text-left ">
        Create your
        <br />
        company account.
      </Text>

      {currentStep === 1 ? renderPhoneStep() : renderOtpStep()}
      <span className="text-center text-ui-fg-base text-small-regular ">
        Already a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.LOG_IN)}
          className="underline"
        >
          Log in
        </button>
        .
      </span>
    </div>
  );

}


export default Register
