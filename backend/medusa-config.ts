import {
  ContainerRegistrationKeys,
  defineConfig,
  loadEnv,
  Modules,
} from "@medusajs/framework/utils"
import { MOBILE_OTP_MODULE } from "src/modules/mobile-otp"
import { APPROVAL_MODULE } from "./src/modules/approval"
import { COMPANY_MODULE } from "./src/modules/company"
import { QUOTE_MODULE } from "./src/modules/quote"

loadEnv(process.env.NODE_ENV!, process.cwd())

module.exports = defineConfig({
  // admin: {
  //   disable: true,
  // },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: {
    [COMPANY_MODULE]: {
      resolve: "./modules/company",
    },
    [QUOTE_MODULE]: {
      resolve: "./modules/quote",
    },
    [MOBILE_OTP_MODULE]: {
      resolve: "./modules/mobile-otp",
    },
    [APPROVAL_MODULE]: {
      resolve: "./modules/approval",
    },
    [Modules.CACHE]: {
      resolve: "@medusajs/medusa/cache-inmemory",
    },
    [Modules.WORKFLOW_ENGINE]: {
      resolve: "@medusajs/medusa/workflow-engine-inmemory",
    },
    [Modules.AUTH]: {
      resolve: "@medusajs/medusa/auth",
      options: {
        providers: [
          // default provider
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
            id: "emailpass",
          },
          {
            resolve: "./src/modules/my-auth",
            id: "my-auth",
            dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
          },
        ],
      },
    },
  },
})
