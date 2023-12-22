import { ActionFunctionArgs, LoaderFunctionArgs, json } from '@remix-run/node';
import { useActionData, useSubmit } from '@remix-run/react';
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

  const response = await admin.graphql(
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
  const responseJson = await response.json();
  console.log(responseJson);
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
  const [itemStrings] = useState([
    'All',
    'Upcomming',
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
    }, { replace: true, method: "POST" })
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
    return {
      id: order.id,
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
    }
  }) || [
      {
        id: '1020',
        order: (
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            #1020
          </Text>
        ),
        date: 'Jul 20 at 4:34pm',
        customer: 'Jaydon Stanton',
        total: '$969.44',
        paymentStatus: <Badge progress="complete">Paid</Badge>,
        fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
      },
      {
        id: '1019',
        order: (
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            #1019
          </Text>
        ),
        date: 'Jul 20 at 3:46pm',
        customer: 'Ruben Westerfelt',
        total: '$701.19',
        paymentStatus: <Badge progress="partiallyComplete">Partially paid</Badge>,
        fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
      },
      {
        id: '1018',
        order: (
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            #1018
          </Text>
        ),
        date: 'Jul 20 at 3.44pm',
        customer: 'Leo Carder',
        total: '$798.24',
        paymentStatus: <Badge progress="complete">Paid</Badge>,
        fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
      },
    ];
  const resourceName = {
    singular: 'order',
    plural: 'orders',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(orders);

  const rowMarkup = orders.map(
    (
      { id, order, date, customer, total, paymentStatus, fulfillmentStatus },
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

        <IndexTable.Cell>{paymentStatus}</IndexTable.Cell>
        <IndexTable.Cell >{fulfillmentStatus}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" numeric>
            {total}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <LegacyCard>
      <IndexFilters
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
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: 'Order' },
          { title: 'Date' },
          { title: 'Customer' },
          { title: 'Payment status' },
          { title: 'Fulfillment status' },
          { title: 'Total', alignment: 'end' },
        ]}
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>
  );

}