import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { PDFDocument } from "pdf-lib";
import { cors } from "remix-utils/cors";
import { insertFieldInPDF } from "~/lib/server_only/pdf/insert-field-in-pdf";
import { FieldType } from "~/lib/type";
const sample = {
  "id": "1703755101684",
  "documentId": "https://cdn.shopify.com/s/files/1/0661/3034/6209/files/Brochure-Digital-Format-NB.pdf?v=1703587780",
  "signerId": "signature",
  "fields": [
    {
      "formId": "nanoid(12)",
      "type": "signature",
      "pageNumber": 1,
      "pageX": 67.11783439490446,
      "pageY": 78.18471337579618,
      "pageWidth": 19.10828025477707,
      "pageHeight": 9.554140127388536
    },
    {
      "formId": "nanoid(12)",
      "type": "signature",
      "pageNumber": 8,
      "pageX": 69.34713375796179,
      "pageY": 51.59235668789809,
      "pageWidth": 19.10828025477707,
      "pageHeight": 19.10828025477707
    }
  ],
  "signature": ''
}

const getFile = async (url: string) => {

  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to get file "${url}", failed with status code ${response.status}`);
  }

  const buffer = await response.arrayBuffer();

  const binaryData = new Uint8Array(buffer);

  return binaryData;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const id = new URL(request.url).searchParams.get("id");
  const data = (await prisma.signature.findFirst({
    ...id ? {
      where: {
        id: id,
      },
    } : {},
  }));
  if (data) {
    const input = JSON.parse(data.data);
    console.log({ input })
    const { documentId, fields, id, signature, signerId } = input;

    const document = await getFile(documentId);

    const doc = await PDFDocument.load(document);

    const createdAt = new Date();


    // Update the document with the fields inserted.
    for (const field of fields) {

      await insertFieldInPDF(doc, {
        ...field,
        Signature: {
          created: createdAt,
          signature,
          id: -1,
          recipientId: -1,
          fieldId: -1,
        },
        id: -1,
        documentId: -1,
        templateId: null,
        recipientId: -1,
      }, signature);
    }

    const unsignedPdfBytes = await doc.save();
    let headers = new Headers({ "Content-Type": "application/pdf" });
    return cors(request, new Response(Buffer.from(unsignedPdfBytes), { status: 200, headers }));
    // const signedPdfBuffer = await signPdf({ pdf: Buffer.from(unsignedPdfBytes) });
  }
  return await cors(request, json({
    data
  }))
}
type Body = {
  id: string,
  documentId: string,
  signerId: "signature",
  fields: FieldType[],
  signature: string
}
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    let body = await request.json() as Body;
    const { documentId, fields, id, signature, signerId } = body;
    console.log({ documentId, fields, id, signerId });
    let response = await prisma.signature.upsert({
      create: {
        data: JSON.stringify(body),
        shop: 'any',
        id: body.id,
      },
      update: {
        data: JSON.stringify(body),
        shop: 'any',
      },
      where: {
        id: body.id,
      },
    });
    return cors(request, json({
      error: null,
      response
    }));
  } catch (error) {
    console.error(error);
    return await cors(request, json({
      error: error.message
    }));
  }

};