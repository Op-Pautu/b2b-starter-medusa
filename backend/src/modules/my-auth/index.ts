import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import MyAuthProviderService from "./service"

export default ModuleProvider(Modules.AUTH, {
  services: [MyAuthProviderService],
})
