import {
  useLoaderData,
  useSearchParams,
  useSubmit
} from "@remix-run/react";
import { base64 } from "@scure/base";
import {
  BlockStack,
  Box,
  DropZone,
  Grid,
  Page,
  PageActions,
  Sticky
} from "@shopify/polaris";
import { useRef, useState } from "react";
import AddFields from "~/components/add-fields";
import PDFViewer, { DocumentDataType } from "~/components/pdf-viewer";
import { loader } from "~/routes/app.signing";



export default function DocumentEdit() {
  const [searchParams, setSearchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const id = searchParams.get("id");
  const [uploadedFile, setUploadedFile] = useState<DocumentDataType | null>(
    id
      ? {
        data: id,
        id: "",
        type: DocumentDataType.S3_PATH,
      }
      : loaderData?.data?.files?.edges?.[0]?.node && {
        data: loaderData?.data?.files?.edges?.[0]?.node.url,
        id: "",
        type: DocumentDataType.S3_PATH,
      },
  );
  const [fields, setFields] = useState<any>(loaderData.doc && JSON.parse(loaderData.doc.data)); // loaderData?.data?.fields || []
  const files =
    loaderData?.data?.files?.edges?.map((edge: any) => {
      let name = edge.node.url.split("/").reverse()[0].split("?v=")[0];
      return {
        ...edge.node,
        name,
      };
    }) || [];
  // function to run after submission: props.afterSubmit

  function handleDropzoneDrop(files: File[]) {
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

      }
    };
    onFileDrop(file);
  }

  var fileUpload = !uploadedFile && <DropZone.FileUpload />;
  const fieldsRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false)
  console.log("===>", loaderData?.doc?.data)
  return (
    <Page title="Signing">
      <Grid>
        <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 8, xl: 8 }}>
          <PDFViewer documentData={uploadedFile} onDocumentLoad={() => {
            setTimeout(() => {
              setLoaded(true)
            }, 1000)

          }} />
        </Grid.Cell>
        <Grid.Cell columnSpan={{ xs: 2, sm: 2, md: 2, lg: 4, xl: 4 }}>
          {loaded && <Sticky>
            <Box paddingBlockStart={"200"}>
              <BlockStack gap="200">
                <AddFields key={loaderData?.doc?.data}
                  defaultFields={fields}
                  onChange={(fields) => (fieldsRef.current = fields)}
                />
                <PageActions
                  primaryAction={{
                    content: "Save",
                    onAction: async () => {
                      submit(
                        {
                          data: JSON.stringify(fieldsRef.current),
                          shop: "any",
                          id: uploadedFile.data,
                        },
                        {
                          method: "POST",
                          encType: "application/json",
                          replace: true,
                        },
                      );
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
          </Sticky>}
        </Grid.Cell>
      </Grid>
    </Page>
  );
}
