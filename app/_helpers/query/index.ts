import { Session } from "@shopify/shopify-api";
import { AdminApiContext } from "node_modules/@shopify/shopify-app-remix/build/ts/server/clients";

export const QUERY_RENTING_DISCOUNTS = `#graphql 
query DiscountNodes($first: Int, $last: Int, $after: String, $before: String, $reverse: Boolean, $sortKey: DiscountSortKeys, $query: String, $savedSearchId: ID) {
  discountNodes(
    first: $first
    last: $last
    after: $after
    before: $before
    reverse: $reverse
    sortKey: $sortKey
    query: $query
    savedSearchId: $savedSearchId
  ) {
    pageInfo {
      hasNextPage
      hasPreviousPage
      __typename
    }
    edges {
      cursor
      node {
        id
        discount {
          ... on DiscountCodeBasic {
            title
            status
            summary
            
            combinesWith {
              ...CombinesWith
              __typename
            }
            merchandiseDiscountClass: discountClass
            asyncUsageCount
            codeCount
            
            customerGets {
              items {
                __typename
              }
              __typename
            }
            __typename
          }
          ... on DiscountCodeBxgy {
            title
            status
            summary
            
            combinesWith {
              ...CombinesWith
              __typename
            }
            merchandiseDiscountClass: discountClass
            asyncUsageCount
            codeCount
           
            __typename
          }
          ... on DiscountCodeFreeShipping {
            title
            status
            summary
            
            combinesWith {
              ...CombinesWith
              __typename
            }
            shippingDiscountClass: discountClass
            asyncUsageCount
            codeCount
          
            __typename
          }
          ... on DiscountAutomaticBasic {
            title
            status
            summary
            
            combinesWith {
              ...CombinesWith
              __typename
            }
            merchandiseDiscountClass: discountClass
            asyncUsageCount
            customerGets {
              items {
                __typename
              }
              __typename
            }
            __typename
          }
          ... on DiscountAutomaticBxgy {
            id
            title
            status
            summary
            combinesWith {
              ...CombinesWith
              __typename
            }
            merchandiseDiscountClass: discountClass
            asyncUsageCount
            __typename
          }
          ... on DiscountAutomaticFreeShipping {
            title
            status
            summary
            combinesWith {
              ...CombinesWith
              __typename
            }
            shippingDiscountClass: discountClass
            asyncUsageCount
            __typename
          }
          ... on DiscountCodeApp {
            __typename
            title
            status
            combinesWith {
              ...CombinesWith
              __typename
            }
            asyncUsageCount
            codeCount
            discountClass
            errorHistory {
              errorsFirstOccurredAt
              hasSharedRecentErrors
              __typename
            }
            appDiscountType {
              functionId
              title
              app {
                id
                ...DiscountListApp
                __typename
              }
              appBridge {
                detailsPath
                __typename
              }
              __typename
            }
          }
          ... on DiscountAutomaticApp {
            __typename
            title
            status
            combinesWith {
              ...CombinesWith
              __typename
            }
            asyncUsageCount
            discountClass
            errorHistory {
              errorsFirstOccurredAt
              hasSharedRecentErrors
              __typename
            }
            appDiscountType {
              functionId
              title
              app {
                id
                ...DiscountListApp
                __typename
              }
              appBridge {
                detailsPath
                __typename
              }
              __typename
            }
          }
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
}

fragment CombinesWith on DiscountCombinesWith {
  productDiscounts
  orderDiscounts
  shippingDiscounts
  __typename
}

fragment DiscountListApp on App {
  id
  title
  handle
  developerName
  shopifyDeveloped
  installation {
    id
    launchUrl
    __typename
  }
  icon {
    id
    transformedSrc: url(transform: {maxWidth: 48, maxHeight: 48})
    __typename
  }
  __typename
}
`;

const createVariables = ({
}) => {
  return {
    first: 50,
    last: null,
    after: null,
    before: null,
    reverse: true,
    sortKey: "ID",
    savedSearchId: null,
    query: "title:renting-*",
  }
}
export const getAllRetingDiscounts = ({ session, admin }: {
  session: Session
  admin: AdminApiContext
}) => async () => {
  const { data } = await admin
    .graphql(QUERY_RENTING_DISCOUNTS, {
      variables: createVariables({}),
    })
    .then((res) => res.json());
  return data
}