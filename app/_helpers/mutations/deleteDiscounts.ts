import { Session } from "@shopify/shopify-api"
import { AdminApiContext } from "node_modules/@shopify/shopify-app-remix/build/ts/server/clients"

export const MUTATION_DELETE_RENTING_DISCOUNT = `#graphql
mutation DeleteDiscountAutomatic($discountId: ID!) {
  discountAutomaticDelete(id: $discountId) {
    deletedAutomaticDiscountId
    userErrors {
      field
      message
      __typename
    }
    __typename
  }
}

`
export const createdeleteMutationsVariables = ({
  id,
}: { id: string }) => {
  return {
    "discountId": id
  }
}
export const deleteRentingDiscount = ({ session, admin }: {
  session: Session
  admin: AdminApiContext
}) => async ({
  id
}: { id: string }) => {
    const variables = createdeleteMutationsVariables({
      id
    })
    console.log('variables', variables)
    const result = await admin.graphql(MUTATION_DELETE_RENTING_DISCOUNT, {
      variables
    }).then(res => res.json())
    console.log('result', result)
    return result
  }
export const deleteRentingDiscounts = ({ session, admin }: {
  session: Session
  admin: AdminApiContext
}) => async ({
  ids
}: {
  ids: string[]
}) => {
    const rundeleteRentingDiscount = deleteRentingDiscount({ session, admin })
    let data = await Promise.all(ids.map(async (id) => {
      return await rundeleteRentingDiscount({
        id
      })
    }))
    return data
  }