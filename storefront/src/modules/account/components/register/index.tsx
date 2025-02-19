"use client"

import { sendOtp, signup } from "@lib/data/customer"
import { Text } from "@medusajs/ui"

import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState, } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(sendOtp, null)

  return (
    <div
      className="max-w-sm flex flex-col items-start gap-2 my-8"
      data-testid="register-page"
    >
      <Text className="text-4xl text-neutral-950 text-left mb-4">
        Create your
        <br />
        company account.
      </Text>
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-4">
          <Input
            label="Phone Number"
            name="phone_number"
            required
            autoComplete="phone-number"
            data-testid="phone-number-input"
            className="bg-white"
          />
          {/* <Input
            label="Company name"
            name="company_name"
            required
            autoComplete="organization"
            data-testid="company-name-input"
            className="bg-white"
          />
            <Input
              label="Company address"
              name="company_address"
              required
              autoComplete="address"
              data-testid="company-address-input"
              className="bg-white"
            /> */}

        </div>
        <div className="border-b border-neutral-200 my-6" />
        <ErrorMessage error={message?.error} data-testid="register-error" />
        {/* <div className="flex items-center gap-2">
          <Checkbox
            name="terms"
            id="terms-checkbox"
            data-testid="terms-checkbox"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(!!checked)}
          ></Checkbox>
          <Label
            id="terms-label"
            className="flex items-center text-ui-fg-base !text-xs hover:cursor-pointer !transform-none"
            htmlFor="terms-checkbox"
            data-testid="terms-label"
          >
            I agree to the terms and conditions.
          </Label>
        </div> */}
        <SubmitButton
          className="w-full mt-6"
          data-testid="register-button"
        // disabled={!termsAccepted}
        >
          Register
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
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
  )
}

export default Register
