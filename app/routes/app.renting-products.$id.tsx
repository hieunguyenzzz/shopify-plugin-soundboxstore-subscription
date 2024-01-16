import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Avatar,
  Bleed,
  BlockStack,
  Card,
  InlineStack,
  ResourceItem,
  ResourceList,
  Text
} from "@shopify/polaris";
import PageDefaultLayout from "~/_components/PageLayouts";
import { authenticate } from "~/shopify.server";
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
  const { admin } = await authenticate.admin(request);
  const id = params.id;
  const {
    data,
  }: {
    data: {
      product: Product;
    };
  } = await admin
    .graphql(
      `#graphql 
    query {
      product(id:"gid://shopify/Product/${id}"){
        id
          title
          description
          variants(first: 40) {
            edges {
              node {
                id
                title
                sku
                image{
                  url
                }
                price 
              }
            }
          }
          images(first: 1) {
            edges {
              node {
                originalSrc
                  }
                }
              }
  }
    }`,
    )
    .then((res) => res.json());
  return data;
};
export const action = async ({ request, params }: ActionFunctionArgs) => {
  return {
    ping: "pong",
  }
}
export default function SettingPage() {
  const { product } = useLoaderData<typeof loader>();
  return (
    <PageDefaultLayout
      title={product.title}
      additionalMetadata={
        product.id
      }
      backAction={{
        url: "/app",
      }}
    >
      <Card >
        <BlockStack>
          <InlineStack gap={"400"}>
            <Avatar
              accessibilityLabel="Product"
              source={product.images.edges[0].node.originalSrc}
            ></Avatar>
            <BlockStack>
              <Text
                as="h2"
                variant="bodyMd"
              >
                {product.title}
              </Text>
            </BlockStack>
          </InlineStack>
        </BlockStack>
      </Card>
      <Card>
        <BlockStack gap={"400"}>
          <Text variant="bodyMd" as="h3" fontWeight="bold">Discounts</Text>
          <Bleed marginInline={"300"}>
            <ResourceList
              resourceName={{ singular: 'customer', plural: 'customers' }}
              items={[
                {
                  id: '105',
                  url: '#',
                  name: 'Mae Jemison',
                  location: 'Decatur, USA',
                },
                {
                  id: '205',
                  url: '#',
                  name: 'Ellen Ochoa',
                  location: 'Los Angeles, USA',
                },
              ]}
              renderItem={(item) => {
                const { id, url, name, location } = item;
                const media = <Avatar customer size="md" name={name} />;

                return (
                  <ResourceItem
                    id={id}
                    url={url}
                    media={media}
                    accessibilityLabel={`View details for ${name}`}
                  >
                    <Text variant="bodyMd" fontWeight="bold" as="h3">
                      {name}
                    </Text>
                    <div>{location}</div>
                  </ResourceItem>
                );
              }}
              showHeader
              totalItemsCount={50}
            />
          </Bleed>

        </BlockStack>
      </Card>
    </PageDefaultLayout>
  );
}
