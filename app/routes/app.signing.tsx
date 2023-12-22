import { ActionFunctionArgs, LoaderFunctionArgs, json } from '@remix-run/node';
import { useActionData, useSubmit } from '@remix-run/react';
import { base64 } from '@scure/base';
import {
  BlockStack,
  DropZone,
  Layout,
  Page,
  Thumbnail
} from "@shopify/polaris";
import { useState } from 'react';
import { toast } from '~/components/lib/use-toast';
import PDFViewer, { DocumentDataType } from '~/components/pdf-viewer';
import { authenticate } from '~/shopify.server';

const STAGED_UPLOADS_CREATE = `
    #graphql
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  let body = await request.json();
  console.log({ body })
  const response = await admin.graphql(STAGED_UPLOADS_CREATE,
    body
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
          <FileDropperFunctional />
        </Layout.Section>
      </Layout>
    </Page>
  );
}




export function FileDropperFunctional() {
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const [uploadedFile, setUploadedFile] = useState<{ file: File; fileBase64: string } | null>();
  console.log({ actionData })
  // function to run after submission: props.afterSubmit



  function handleDropzoneDrop(files: File[]) {
    // console.log(files)
    let file = files[0]
    const onFileDrop = async (file: File) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const fileBase64 = base64.encode(new Uint8Array(arrayBuffer));
        setUploadedFile({
          file,
          fileBase64,
        });
      } catch {
        toast({
          title: 'Something went wrong',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      }
    };
    onFileDrop(file)

  }

  var fileUpload = !uploadedFile && <DropZone.FileUpload />;
  var uploadedFiles = uploadedFile && (
    <div style={{ padding: '0' }}>
      <BlockStack >
        <BlockStack align='center' >
          <Thumbnail
            size="small"
            alt={uploadedFile.file.name}
            source={
              () => <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 512 512" height="200px" width="200px" xmlns="http://www.w3.org/2000/svg"><path d="M96 352V96c0-35.3 28.7-64 64-64H416c35.3 0 64 28.7 64 64V293.5c0 17-6.7 33.3-18.7 45.3l-58.5 58.5c-12 12-28.3 18.7-45.3 18.7H160c-35.3 0-64-28.7-64-64zM272 128c-8.8 0-16 7.2-16 16v48H208c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h48v48c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V256h48c8.8 0 16-7.2 16-16V208c0-8.8-7.2-16-16-16H320V144c0-8.8-7.2-16-16-16H272zm24 336c13.3 0 24 10.7 24 24s-10.7 24-24 24H136C60.9 512 0 451.1 0 376V152c0-13.3 10.7-24 24-24s24 10.7 24 24l0 224c0 48.6 39.4 88 88 88H296z" /></svg>
            }
          />
          <div>
            {uploadedFile.file.name} <small>{uploadedFile.file.size} bytes</small>
          </div>
        </BlockStack>
      </BlockStack>
    </div>
  );



  return (

    <>
      <DropZone onDrop={handleDropzoneDrop} allowMultiple={false}>
        {uploadedFiles}
        {fileUpload}
      </DropZone>
      {
        uploadedFile && <PDFViewer
          documentData={{
            id: '',
            data: uploadedFile.fileBase64,
            initialData: uploadedFile.fileBase64,
            type: DocumentDataType.BYTES_64,
          }}
        />
      }
    </>
  );



}