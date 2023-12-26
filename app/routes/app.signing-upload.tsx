import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { base64 } from "@scure/base";
import {
  BlockStack,
  Box,
  DropZone,
  Frame,
  Grid,
  Layout,
  Navigation,
  Page,
  PageActions,
  Sticky,
} from "@shopify/polaris";
import { ArrowLeftMinor, PackageFilledMajor } from "@shopify/polaris-icons";
import { useRef, useState } from "react";
import AddFields from "~/components/add-fields";
import { toast } from "~/components/lib/use-toast";
import PDFViewer, { DocumentDataType } from "~/components/pdf-viewer";
import { authenticate } from "~/shopify.server";

const STAGED_UPLOADS_CREATE = `#graphql
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          resourceUrl
          url
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
`;
const FILE_CREATE = `#graphql
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
         alt
         id
          
        }
        userErrors {
          field
          message
        }
      }
    }
`;
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
  return response;
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  let body = await request.json();
  let response = await admin.graphql(STAGED_UPLOADS_CREATE, body);
  let responseJson = await response.json();
  response = await admin.graphql(FILE_CREATE, {
    variables: {
      files: {
        contentType: "FILE",
        originalSource:
          responseJson.data.stagedUploadsCreate.stagedTargets[0].resourceUrl,
      },
    },
  });
  responseJson = await response.json();
  return json(responseJson);
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
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const [uploadedFile, setUploadedFile] = useState<DocumentDataType | null>(
    loaderData?.data?.files?.edges?.[0]?.node && {
      data: loaderData?.data?.files?.edges?.[0]?.node.url,
      id: "",
      type: DocumentDataType.S3_PATH,
    },
  );
  const files = loaderData?.data?.files?.edges?.map((edge: any) => {
    let name = edge.node.url.split("/").reverse()[0].split("?v=")[0];
    return {
      ...edge.node,
      name,
    };
  });
  console.log({ actionData, loaderData, files });
  // function to run after submission: props.afterSubmit

  function handleDropzoneDrop(files: File[]) {
    // console.log(files)
    let file = files[0];

    const onFileDrop = async (file: File) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const fileBase64 = base64.encode(new Uint8Array(arrayBuffer));

        setUploadedFile({
          data: fileBase64,
          id: "",
          type: DocumentDataType.BYTES_64,
        });
        submit(
          {
            variables: {
              input: [
                {
                  ...file,
                  mimeType: "application/pdf",
                  filename: "Brochure-Digital-Format-NB.pdf",
                  fileSize: file.size + "",
                  resource: "FILE",
                  httpMethod: "POST",
                },
              ],
            },
          },
          {
            method: "POST",
            encType: "application/json",
          },
        );
        // setFiles((files) => [...files, file]);
      } catch {
        toast({
          title: "Something went wrong",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    };
    onFileDrop(file);
  }

  var fileUpload = !uploadedFile && <DropZone.FileUpload />;
  const fieldsRef = useRef<any>(null);
  console.log({ uploadedFile });
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
                {
                  label: "Upload Document",
                  icon: PackageFilledMajor,
                  onClick: () => setUploadedFile(null),
                },
                ...files.map((file) => {
                  return {
                    label: file.name,
                    icon: PackageFilledMajor,
                    onClick: () => {
                      setUploadedFile({
                        data: file.url,
                        id: "",
                        type: DocumentDataType.S3_PATH,
                      });
                    },
                  };
                }),
              ]}
            />
          </Navigation>
        }
      >
        {uploadedFile ? (
          <Page title="Signing">
            <Grid>
              <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 8, xl: 8 }}>
                <PDFViewer documentData={uploadedFile} />
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 2, sm: 2, md: 2, lg: 4, xl: 4 }}>
                <Sticky>
                  <Box paddingBlockStart={"200"}>
                    <BlockStack gap="200">
                      <AddFields
                        onChange={(fields) => (fieldsRef.current = fields)}
                      />
                      <PageActions
                        primaryAction={{
                          content: "Save",
                          onAction: async () => {
                            "use server";
                            await prisma.document.create({
                              data: {
                                data: JSON.stringify(fieldsRef.current),
                                shop: "any",
                                id: uploadedFile.data,
                              },
                            });
                          },
                        }}
                        secondaryActions={[
                          {
                            content: "Delete",
                            destructive: true,
                          },
                        ]}
                      />
                    </BlockStack>
                  </Box>
                </Sticky>
              </Grid.Cell>
            </Grid>
          </Page>
        ) : (
          <Page>
            <DropZone onDrop={handleDropzoneDrop} allowMultiple={false}>
              {fileUpload}
            </DropZone>
          </Page>
        )}
      </Frame>
    </>
  );
}
