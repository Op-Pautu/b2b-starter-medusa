"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { track } from "@vercel/analytics/server"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { B2BCustomer } from "types/global"
import { createCompany, createEmployee } from "./companies"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "./cookies"
import { retrieveCart, updateCart } from "./cart"
import { QueryCompany, StoreEmployeeResponse } from "@starter/types"

export const retrieveCustomer = async (): Promise<B2BCustomer | null> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("customers")),
  }

  return await sdk.client
    .fetch<{ customer: B2BCustomer }>(`/store/customers/me`, {
      method: "GET",
      query: {
        fields: "*employee, *orders",
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ customer }) => customer as B2BCustomer)
    .catch(() => null)
}

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

type MobileOtp = {
  id: string
  phone: string
  attempt_count: number
  otp_hash: string
  expires_at: Date
  is_valid: boolean
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

interface OtpResponse {
  success: boolean
  error: null | string
  otp?: string
  mobileOtpTable?: MobileOtp
}

interface VerificationResponse {
  success: boolean
  error: null | string
  message?: string
  customer?: any
  company?: QueryCompany
  employee?: void | StoreEmployeeResponse
  authIdentityId?: string
  token?: string
}

export async function sendOtp(
  _currentState: unknown,
  formData: FormData
): Promise<OtpResponse> {
  const phone = formData.get("phone_number") as string

  if (!phone?.trim()) {
    return {
      success: false,
      error: "Phone number is required",
    }
  }

  try {
    const res = await sdk.client.fetch<OtpResponse>(
      `/store/login-with-otp/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { phone },
        credentials: "include",
      }
    )

    const { error, success, otp, mobileOtpTable } = res
    if (res.error) {
      throw new Error(res.error)
    }

    console.log("otp:", otp)
    console.log("mobileOtpTableId:", mobileOtpTable?.id)

    return {
      success: true,
      error: null,
      otp: otp,
      mobileOtpTable: mobileOtpTable,
    }
  } catch (err) {
    console.error("OTP Request Error:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send OTP",
    }
  }
}

export async function otpVerify(
  _currentState: unknown,
  formData: FormData
): Promise<VerificationResponse> {
  const otpRecordId = formData.get("otp_record_id") as string
  const otpValue = formData.get("otp_value") as string

  if (!otpValue?.trim() || !otpRecordId?.trim()) {
    return {
      success: false,
      error: "OTP and record ID are required",
    }
  }

  try {
    const res = await sdk.client.fetch<VerificationResponse>(
      `/store/login-with-otp/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { otpValue, otpRecordId },
      }
    )

    const { success, message, error, customer, token } = res

    if (error) {
      throw new Error(error)
    }
    // const loginToken = await sdk.client.fetch<{ token: string }>(
    //   `/auth/customer/my-auth`,
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: { phone: customer.phone, otp: otpValue },
    //   }
    // )
    // if (!loginToken) {
    //   throw new Error("Login failed. No token received.")
    // }

    // const loginToken = await sdk.auth.login("customer", "my-auth", {
    //   phone: res.customer.phone,
    //   otp: otpValue,
    // })
    // if (!loginToken) {
    //   throw new Error("Login failed. No token received.")
    // }
    console.log({ token })
    const customHeaders = { authorization: `Bearer ${token}` }

    setAuthToken(token as string)

    const companyForm = {
      name: formData.get("company_name") as string,
      phone: formData.get("phone_number") as string,
      address: formData.get("company_address") as string,
      email: "",
    }

    console.log(companyForm.name)
    const createdCompany = await createCompany(companyForm)
    if (!createdCompany) {
      throw new Error("Failed to create company")
    }

    if (createdCompany) {
      track("company_created", {
        company_id: createdCompany.id,
      })
    }
    const createdEmployee = await createEmployee({
      company_id: createdCompany?.id as string,
      customer_id: customer.id,
      is_admin: true,
      spending_limit: 0,
    }).catch((err) => {
      console.log("error creating employee", err)
    })

    if (createdEmployee) {
      track("employee_created", {
        employee_id: createdEmployee.employee.id,
      })
    }
    const cacheTag = await getCacheTag("customers")

    revalidateTag(cacheTag)
    await transferCart()

    return {
      success: true,
      error: null,
      message: message,
      customer: res.customer,
      company: createdCompany,
      employee: createdEmployee,
    }
  } catch (err) {
    console.error(
      "OTP Verification Error:",
      err instanceof Error ? err.message : "Verification failed"
    )
    return {
      success: false,
      error: err instanceof Error ? err.message : "Verification failed",
    }
  }
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
    company_name: formData.get("company_name") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })
    const customHeaders = { authorization: `Bearer ${token}` }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      customHeaders
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    setAuthToken(loginToken as string)

    const companyForm = {
      name: formData.get("company_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("company_phone") as string,
      address: formData.get("company_address") as string,
      city: formData.get("company_city") as string,
      state: formData.get("company_state") as string,
      zip: formData.get("company_zip") as string,
      country: formData.get("company_country") as string,
      currency_code: formData.get("currency_code") as string,
    }

    const createdCompany = await createCompany(companyForm)

    const createdEmployee = await createEmployee({
      company_id: createdCompany?.id as string,
      customer_id: createdCustomer.id,
      is_admin: true,
      spending_limit: 0,
    }).catch((err) => {
      console.log("error creating employee", err)
    })

    const cacheTag = await getCacheTag("customers")
    revalidateTag(cacheTag)

    await transferCart()

    return {
      customer: createdCustomer,
      company: createdCompany,
      employee: createdEmployee,
    }
  } catch (error: any) {
    console.log("error", error)
    return error.toString()
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        track("customer_logged_in")
        setAuthToken(token as string)

        const [customerCacheTag, productsCacheTag, cartsCacheTag] =
          await Promise.all([
            getCacheTag("customers"),
            getCacheTag("products"),
            getCacheTag("carts"),
          ])

        revalidateTag(customerCacheTag)

        const customer = await retrieveCustomer()
        const cart = await retrieveCart()

        if (customer?.employee?.company_id) {
          await updateCart({
            metadata: {
              ...cart?.metadata,
              company_id: customer.employee.company_id,
            },
          })
        }

        revalidateTag(productsCacheTag)
        revalidateTag(cartsCacheTag)
      })
  } catch (error: any) {
    return error.toString()
  }

  try {
    await transferCart()
  } catch (error: any) {
    return error.toString()
  }
}

export async function signout(countryCode: string, customerId: string) {
  await sdk.auth.logout()
  removeAuthToken()
  track("customer_logged_out")

  // remove next line if want the cart to persist after logout
  await removeCartId()

  const [authCacheTag, customerCacheTag, productsCacheTag, cartsCacheTag] =
    await Promise.all([
      getCacheTag("auth"),
      getCacheTag("customers"),
      getCacheTag("products"),
      getCacheTag("carts"),
    ])

  revalidateTag(authCacheTag)
  revalidateTag(customerCacheTag)
  revalidateTag(productsCacheTag)
  revalidateTag(cartsCacheTag)

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")

  revalidateTag(cartCacheTag)
}

export const addCustomerAddress = async (
  _currentState: unknown,
  formData: FormData
): Promise<any> => {
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async () => {
      const cacheTag = await getCacheTag("customers")
      revalidateTag(cacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const cacheTag = await getCacheTag("customers")
      revalidateTag(cacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId = currentState.addressId as string

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const cacheTag = await getCacheTag("customers")
      revalidateTag(cacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
