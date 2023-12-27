import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  useLoaderData,
  useSearchParams
} from "@remix-run/react";
import {
  Frame,
  Layout,
  Navigation,
  Page
} from "@shopify/polaris";
import { ArrowLeftMinor, PackageFilledMajor } from "@shopify/polaris-icons";
import DocumentEdit from "~/components/document-edit";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query {
      files(first: 3,query: "media_type:GenericFile status:ready") {
        edges {
          node {
            id
            fileStatus
            ... on GenericFile {
              
              id
              url
              originalFileSize
            }
          }
        }
      }
    }`,
  );
  let resJson = await response.json();
  const id = new URL(request.url).searchParams.get("id") || resJson?.data?.files?.edges?.[0]?.node.url;
  let doc = id
    ? await prisma.document.findFirst({
      where: {
        id: id,
      },
    })
    : null;
  return ({
    ...resJson,
    id,
    doc
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  let body = await request.json();
  let response = await prisma.document.upsert({
    create: body,
    update: body,
    where: {
      id: body.id,
    },
  });
  return response;
};
export default function AdditionalPage() {
  return (
    <Page fullWidth>
      <ui-title-bar title="Subscriptions" />
      <Layout>
        <Layout.Section>
          <FileDropperFunctional />
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export function FileDropperFunctional() {
  const [searchParams, setSearchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const files =
    loaderData?.data?.files?.edges?.map((edge: any) => {
      let name = edge.node.url.split("/").reverse()[0].split("?v=")[0];
      return {
        ...edge.node,
        name,
      };
    }) || [];
  // function to run after submission: props.afterSubmit


  return (
    <>
      <Frame
        navigation={
          <Navigation location="/">
            <Navigation.Section
              items={[
                {
                  label: "Back",
                  icon: ArrowLeftMinor,
                  url: "/app",
                },
              ]}
            />
            <Navigation.Section
              separator
              title={"Documents"}
              items={[
                ...files.map((file) => {
                  return {
                    label: file.name,
                    icon: PackageFilledMajor,
                    onClick: () => {
                      const params = new URLSearchParams();
                      params.set("id", file.url);
                      setSearchParams(params);
                    },
                  };
                }),
              ]}
            />
          </Navigation>
        }
      >
        <DocumentEdit key={loaderData?.doc?.data} />
      </Frame>
    </>
  );
}
