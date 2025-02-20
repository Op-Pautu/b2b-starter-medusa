import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk"
import { ModuleCreateCompany } from "../../../types"
import { createCompaniesStep } from "../steps"

export const createCompaniesWorkflow = createWorkflow(
  "create-companies",
  function (input: ModuleCreateCompany[]) {
    const companies = createCompaniesStep(input)

    return new WorkflowResponse(companies)
  }
)
