import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Avatar, Card, ResourceItem, ResourceList, Text } from "@shopify/polaris";
import PageDefaultLayout from "~/_components/PageLayouts";
import { authenticate } from "~/shopify.server";
type Product = {
  id: string
  title: string
  description: string
  images: {
    edges: {
      node: {
        originalSrc: string
      }
    }[]
  }
}
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request)

  const { data }: {
    data: {
      products: {
        edges: {
          node: Product
        }[]
      }
    }
  } = await admin.graphql(
    `#graphql 
    query {
    products(first: 10, query: "tag:hiring") {
      edges {
        node {
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
          }
        }
    }`
  ).then(res => res.json())
  return data
}
export default function SettingPage() {
  const { products } = useLoaderData<typeof loader>()
  console.log({ products })
  return (
    <PageDefaultLayout title="Renting Products" backAction={{
      url: '/app',
    }}>
      <Card padding={"0"}>
        <ResourceList
          showHeader
          totalItemsCount={products.edges.length}
          resourceName={{ singular: 'product', plural: 'products' }}
          items={
            products.edges?.map(({ node: product }) => ({
              id: product.id,
              url: `/app/renting-products/${product.id.split('/').pop()}`,
              name: product.title,
              description: product.description,
              avatar: product.images.edges[0].node.originalSrc
            }))
          }
          renderItem={(item) => {
            const { name, url, id, avatar } = item;
            console.log({ item })
            const media = <Avatar source={avatar} size="md" name={name} />;
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
              </ResourceItem>
            );
          }}
        />
      </Card>
    </PageDefaultLayout>
  )
}

