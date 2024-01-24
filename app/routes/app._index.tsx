import { ActionFunctionArgs, LoaderFunctionArgs, json } from '@remix-run/node';
import { useActionData, useNavigation, useSubmit } from '@remix-run/react';
import type { IndexFiltersProps, TabProps } from '@shopify/polaris';
import {
  Badge,
  IndexFilters,
  IndexTable,
  Layout,
  LegacyCard,
  Page,
  Text,
  useBreakpoints,
  useIndexResourceState,
  useSetIndexFiltersMode
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from 'react';
import { authenticate } from '~/shopify.server';


export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.json();
  console.log("body", body);
  const { preview, pageInfo, next } = body;
  let response = {}
  if (preview) {
    response = await admin.graphql(
      `#graphql
        query getSubscriptions {
          orders(last: 20, query: "tag:hiring", before: "${pageInfo?.startCursor}") {
            pageInfo {
              endCursor
              hasNextPage
              hasPreviousPage
              startCursor
            }
            nodes {
              id
              name
              email
              customer{
                firstName
                lastName
                email
              }
              closed
              cancelledAt
              processedAt
              note
              hasTimelineComment
              displayFinancialStatus
              displayFulfillmentStatus
              returnStatus
              shippingLine {
                id
                title
              }
              currentTotalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
                presentmentMoney {
                  amount
                  currencyCode
                }
              }
              currentSubtotalLineItemsQuantity
              disputes {
                id
                initiatedAs
                status
              }
              tags
            }
          }
        }`,
      {
        variables: {
          input: {
          },
        },
      }
    );
  } else if (next) {
    response = await admin.graphql(
      `#graphql
        query getSubscriptions {
          orders(first: 20, query: "tag:hiring", after: "${pageInfo?.endCursor}") {
            pageInfo {
              endCursor
              hasNextPage
              hasPreviousPage
              startCursor
            }
            nodes {
              id
              name
              email
              customer{
                firstName
                lastName
                email
              }
              closed
              cancelledAt
              processedAt
              note
              hasTimelineComment
              displayFinancialStatus
              displayFulfillmentStatus
              returnStatus
              shippingLine {
                id
                title
              }
              currentTotalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
                presentmentMoney {
                  amount
                  currencyCode
                }
              }
              currentSubtotalLineItemsQuantity
              disputes {
                id
                initiatedAs
                status
              }
              tags
            }
          }
        }`,
      {
        variables: {
          input: {
          },
        },
      }
    );
  }
  else {
    response = await admin.graphql(
      `#graphql
      query getSubscriptions {
        orders(first: 20, query: "tag:hiring") {
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
          nodes {
            id
            name
            email
            customer{
              firstName
              lastName
              email
            }
            closed
            cancelledAt
            processedAt
            note
            hasTimelineComment
            displayFinancialStatus
            displayFulfillmentStatus
            returnStatus
            shippingLine {
              id
              title
            }
            currentTotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            currentSubtotalLineItemsQuantity
            disputes {
              id
              initiatedAs
              status
            }
            tags
          }
        }
      }`,
      {
        variables: {
          input: {
          },
        },
      }
    );
  }
  const responseJson = await response.json();
  console.log("responseJson", responseJson);
  return json({
    orders: responseJson.data?.orders || [],
  });
};
export default function AdditionalPage() {
  return (
    <Page>
      <ui-title-bar title="Subscriptions" />
      <Layout>
        <Layout.Section>
          <Content />
        </Layout.Section>
      </Layout>
    </Page>
  );
}


function Content() {
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  let loading = useNavigation().state === "loading"
  const [itemStrings] = useState([
    'All',
    // 'Upcomming',
  ]);
  useEffect(() => {
    console.log(actionData);
  }, [actionData]);

  const tabs: TabProps[] = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => { },
    id: `${item}-${index}`,
    isLocked: index === 0,

  }));
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    submit({
      test: "test"
    }, { replace: true, method: "POST", encType: "application/json" })
  }, [selected]);
  const sortOptions: IndexFiltersProps['sortOptions'] = [
    { label: 'Order', value: 'order asc', directionLabel: 'Ascending' },
    { label: 'Order', value: 'order desc', directionLabel: 'Descending' },
    { label: 'Customer', value: 'customer asc', directionLabel: 'A-Z' },
    { label: 'Customer', value: 'customer desc', directionLabel: 'Z-A' },
    { label: 'Date', value: 'date asc', directionLabel: 'A-Z' },
    { label: 'Date', value: 'date desc', directionLabel: 'Z-A' },
    { label: 'Total', value: 'total asc', directionLabel: 'Ascending' },
    { label: 'Total', value: 'total desc', directionLabel: 'Descending' },
  ];
  const [sortSelected, setSortSelected] = useState(['order asc']);
  const { mode, setMode } = useSetIndexFiltersMode();
  const onHandleCancel = () => { };

  const [queryValue, setQueryValue] = useState('');

  const handleFiltersQueryChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );

  const handleQueryValueRemove = useCallback(() => setQueryValue(''), []);
  const handleFiltersClearAll = useCallback(() => {

    handleQueryValueRemove();
  }, [
    handleQueryValueRemove,
  ]);


  const orders = actionData?.orders.nodes.map((order: any) => {
    let id = order.id.split('/').reverse()[0];
    return {
      id,
      order: (
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {order.name}
        </Text>
      ),
      date: new Date(order.processedAt).toUTCString(),
      customer: `${order.customer.firstName} ${order.customer.lastName}`,
      total: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: order.currentTotalPriceSet.presentmentMoney.currencyCode
      }).format(Number(order.currentTotalPriceSet.presentmentMoney.amount)),
      paymentStatus: <Badge progress="complete">Paid</Badge>,
      fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
      href: `shopify://admin/orders/${id}`,
    }
  }) || [

    ];
  const resourceName = {
    singular: 'order',
    plural: 'orders',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(orders);

  const rowMarkup = orders.map(
    (
      { id, order, date, customer, total, paymentStatus, fulfillmentStatus, href },
      index,
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {order}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{date}</IndexTable.Cell>
        <IndexTable.Cell>{customer}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" numeric>
            {total}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" numeric>
            <a style={{
              textAlign: "right"
            }} href={href} target="_top">{'Order details'}</a>
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <LegacyCard>
      <IndexFilters
        disabled={loading}
        loading={loading}
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        queryValue={queryValue}
        queryPlaceholder="Searching in all"
        onQueryChange={handleFiltersQueryChange}
        onQueryClear={() => setQueryValue('')}
        onSort={setSortSelected}
        cancelAction={{
          onAction: onHandleCancel,
          disabled: false,
          loading: false,
        }}
        canCreateNewView={false}
        tabs={tabs}
        selected={selected}
        onSelect={setSelected}
        filters={[]}
        appliedFilters={[]}
        onClearAll={handleFiltersClearAll}
        mode={mode}
        setMode={setMode}
      />
      <IndexTable
        condensed={useBreakpoints().smDown}
        resourceName={resourceName}
        itemCount={orders.length}
        selectedItemsCount={
          allResourcesSelected ? 'All' : selectedResources.length
        }
        selectable={false}
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: 'Order' },
          { title: 'Date' },
          { title: 'Customer' },
          { title: 'Total', alignment: 'end' },
          { title: 'Details', alignment: 'end' },
        ]}
        pagination={{
          hasNext: actionData?.orders.pageInfo.hasNextPage,
          hasPrevious: actionData?.orders.pageInfo.hasPreviousPage,
          onPrevious() {
            submit({
              preview: true,
              pageInfo: actionData?.orders.pageInfo,
            }, { replace: true, method: "POST", encType: "application/json" })
          },
          onNext: () => {
            submit({
              next: true,
              pageInfo: actionData?.orders.pageInfo,
            }, { replace: true, method: "POST", encType: "application/json" })
          },
        }}
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>
  );

}