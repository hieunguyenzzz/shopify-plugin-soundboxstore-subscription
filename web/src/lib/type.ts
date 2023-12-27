import { FieldType } from "./contants";


export const FRIENDLY_FIELD_TYPE = {
  [FieldType.SIGNATURE]: 'Signature',
  [FieldType.FREE_SIGNATURE]: 'Free Signature',
  [FieldType.TEXT]: 'Text',
  [FieldType.DATE]: 'Date',
  [FieldType.EMAIL]: 'Email',
  [FieldType.NAME]: 'Name',
};

export type FieldType = {
  formId: string;
  type: "signature"
  pageNumber: number;
  pageX: number;
  pageY: number;
  pageWidth: number;
  pageHeight: number;
};