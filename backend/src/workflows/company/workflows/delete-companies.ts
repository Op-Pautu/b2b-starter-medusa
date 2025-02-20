import { WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createWorkflow } from "@medusajs/workflows-sdk"
import { ModuleDeleteCompany } from "../../../types"
import { deleteCompaniesStep } from "../steps"

export const deleteCompaniesWorkflow = createWorkflow(
  "delete-companies",
  function (input: ModuleDeleteCompany) {
    deleteCompaniesStep([input.id])

    return new WorkflowResponse(undefined)
  }
)
