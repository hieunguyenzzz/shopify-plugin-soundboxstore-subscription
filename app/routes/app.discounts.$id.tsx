import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Card, Icon, ResourceItem, ResourceList, Text
} from "@shopify/polaris";
import PageDefaultLayout from "~/_components/PageLayouts";
import { authenticate } from "~/shopify.server";
let QUERY = `#graphql 
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
`
type Product = {
  id: string;
  title: string;
  description: string;
  images: {
    edges: {
      node: {
        originalSrc: string;
      };
    }[];
  };
};
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, } = await authenticate.admin(request);
  const { data } = await admin.graphql(QUERY,
    {
      variables: {
        "first": 50,
        "last": null,
        "after": null,
        "before": null,
        "reverse": true,
        "sortKey": "ID",
        "savedSearchId": null,
        "query": null
      }
    }
  ).then((res) => res.json());
  let discounts: {
    id: string;
    name: string;
  }[] = data?.discountNodes?.edges?.map((item: any) => {
    return {
      id: item?.node?.id,
      name: item?.node?.discount?.title,
      ...item?.node?.discount
    }
  })
  return {
    discounts, data
  };
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  return {
    ping: "pong",
  }
}
export default function SettingPage() {
  const { discounts, data } = useLoaderData<typeof loader>();
  console.log({ discounts, data })
  return (
    <PageDefaultLayout
      title={"Discounts"}
      backAction={{
        url: "/app",
      }}
      primaryAction={{
        content: "New Discount",
        url: "/app/discounts/new",
      }}
    >
      <Card >
        <ResourceList
          resourceName={{ singular: 'discount', plural: 'discounts' }}
          items={discounts}
          renderItem={(item) => {
            const { id, name } = item;
            const media = <Icon source={`<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 384 512" height="200px" width="200px" xmlns="http://www.w3.org/2000/svg"><path d="M374.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-320 320c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l320-320zM128 128A64 64 0 1 0 0 128a64 64 0 1 0 128 0zM384 384a64 64 0 1 0 -128 0 64 64 0 1 0 128 0z"></path></svg>`
            }>
            </Icon>;
            return (
              <ResourceItem
                id={id}
                url={"#"}
                media={media}
                accessibilityLabel={`View details for ${name}`}
              >
                <Text variant="bodyMd" fontWeight="bold" as="h3">
                  {name}
                </Text>
                <div>{''}</div>
              </ResourceItem>
            );
          }}
          showHeader
          totalItemsCount={discounts.length}
        />
      </Card>
    </PageDefaultLayout>
  );
}
