import { Heading } from "@medusajs/ui"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Approvals",
  description: "Overview of your pending approvals.",
}

export default async function Approvals({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const urlSearchParams = await searchParams

  return (
    <div className="w-full flex flex-col gap-y-4">
      <Heading>Approvals</Heading>

      <Heading level="h2" className="text-neutral-700">
        Pending
      </Heading>


      <Heading level="h2" className="text-neutral-700">
        Approved
      </Heading>

      <Heading level="h2" className="text-neutral-700">
        Rejected
      </Heading>

    </div>
  )
}
