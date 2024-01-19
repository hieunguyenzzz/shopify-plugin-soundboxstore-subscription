import { Session } from "@shopify/shopify-api"
import { AdminApiContext } from "node_modules/@shopify/shopify-app-remix/build/ts/server/clients"

export const MUTATION_CREATE_RENTING_DISCOUNT = `#graphql
mutation createRentingDiscount(
  $basicAutomaticDiscount: DiscountAutomaticBasicInput!
) {
  discountAutomaticBasicCreate(
    automaticBasicDiscount: $basicAutomaticDiscount
  ) {
    automaticDiscountNode {
      id
     
      __typename
    }
    userErrors {
      ...DiscountUserError
      __typename
    }
    __typename
  }
}

fragment DiscountUserError on DiscountUserError {
  code
  extraInfo
  field
  message
  __typename
}`
export const createMutationsVariables = ({
  collectionId, percentage, months
}: {
  collectionId: string
  percentage: number
  months: number
}) => {
  let p = percentage / 100
  return {
    "basicAutomaticDiscount": {
      "startsAt": new Date().toISOString(),
      "endsAt": null,
      "title": `renting-percentage:${percentage}-months:${months}`,
      "combinesWith": {
        "productDiscounts": false,
        "orderDiscounts": false,
        "shippingDiscounts": false
      },
      "recurringCycleLimit": 1,
      "minimumRequirement": {
        "quantity": {
          "greaterThanOrEqualToQuantity": months + ''
        },
        "subtotal": {
          "greaterThanOrEqualToSubtotal": null
        }
      },
      "customerGets": {
        "value": {
          "percentage": p
        },
        "items": {
          "all": false,
          "products": null,
          "collections": {
            "add": [
              collectionId
            ],
            "remove": []
          }
        },
        "appliesOnOneTimePurchase": true,
        "appliesOnSubscription": false
      }
    }
  }
}
export const createRentingDiscount = ({ session, admin }: {
  session: Session
  admin: AdminApiContext
}) => async ({
  collectionId, percentage, months
}: {
  collectionId: string
  percentage: number
  months: number
}) => {
    const variables = createMutationsVariables({
      collectionId, percentage, months
    })
    console.log('variables', variables)
    const result = await admin.graphql(MUTATION_CREATE_RENTING_DISCOUNT, {
      variables
    }).then(res => res.json())
    console.log('result', result)
    return result
  }
export const createRentingDiscounts = ({ session, admin }: {
  session: Session
  admin: AdminApiContext
}) => async ({
  collectionId, options
}: {
  collectionId: string

  options: {
    months: number
    percent: number
  }[]
}) => {
    const runCreateRentingDiscount = createRentingDiscount({ session, admin })
    let data = await Promise.all(options.map(async (option) => {
      const { months, percent } = option
      return await runCreateRentingDiscount({
        collectionId, percentage: percent, months
      })
    }))
    return data
  }