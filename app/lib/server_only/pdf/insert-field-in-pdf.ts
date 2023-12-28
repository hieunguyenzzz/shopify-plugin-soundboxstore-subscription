import fontkit from '@pdf-lib/fontkit';
import { PDFDocument } from 'pdf-lib';

import { FieldType } from '~/lib/type';

export const insertFieldInPDF = async (pdf: PDFDocument, field: FieldType, signature: string) => {

  pdf.registerFontkit(fontkit);

  const pages = pdf.getPages();

  const page = pages.at(field.pageNumber - 1);

  if (!page) {
    throw new Error(`Page ${field.pageNumber} does not exist`);
  }

  const { width: pageWidth, height: pageHeight } = page.getSize();

  const fieldWidth = pageWidth * (Number(field.pageWidth) / 100);
  const fieldHeight = pageHeight * (Number(field.pageHeight) / 100);

  const fieldX = pageWidth * (Number(field.pageX) / 100);
  const fieldY = pageHeight * (Number(field.pageY) / 100);

  const image = await pdf.embedPng(signature);

  let imageWidth = image.width;
  let imageHeight = image.height;

  const scalingFactor = Math.min(fieldWidth / imageWidth, fieldHeight / imageHeight, 1);

  imageWidth = imageWidth * scalingFactor;
  imageHeight = imageHeight * scalingFactor;

  const imageX = fieldX + (fieldWidth - imageWidth) / 2;
  let imageY = fieldY + (fieldHeight - imageHeight) / 2;

  // Invert the Y axis since PDFs use a bottom-left coordinate system
  imageY = pageHeight - imageY - imageHeight;

  page.drawImage(image, {
    x: imageX,
    y: imageY,
    width: imageWidth,
    height: imageHeight,
  });

  return pdf;
};

export const insertFieldInPDFBytes = async (
  pdf: ArrayBuffer | Uint8Array | string,
  field: FieldType, signature: string
) => {
  const pdfDoc = await PDFDocument.load(pdf);

  await insertFieldInPDF(pdfDoc, field, signature);

  return await pdfDoc.save();
};
