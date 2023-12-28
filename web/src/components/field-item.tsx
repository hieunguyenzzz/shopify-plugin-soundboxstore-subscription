"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";
const PDF_VIEWER_PAGE_SELECTOR = ".react-pdf__Page";
export type FieldType = {
  formId: string;
  type: "signature"
  pageNumber: number;
  pageX: number;
  pageY: number;
  pageWidth: number;
  pageHeight: number;
};
type TDocumentFlowFormSchema = {
  fields: [FieldType];
};
type Field = TDocumentFlowFormSchema["fields"][0];

export type FieldItemProps = {
  field: Field;
  passive?: boolean;
  disabled?: boolean;
  minHeight?: number;
  minWidth?: number;
  onResize?: (_node: HTMLElement) => void;
  onMove?: (_node: HTMLElement) => void;
  onRemove?: () => void;
  imageUrl?: string
  container?: HTMLElement
};

export const FieldItem = ({
  field,
  passive,
  imageUrl,
  disabled,
  minHeight: _minHeight,
  minWidth: _minWidth,
  onResize,
  onMove,
  container,
  onRemove,
}: FieldItemProps) => {
  const [active, setActive] = useState(false);
  const [coords, setCoords] = useState({
    pageX: field.pageX || 0,
    pageY: field.pageX || 0,
    pageHeight: field.pageHeight || 0,
    pageWidth: field.pageWidth || 0,
  });
  const calculateCoords = useCallback(() => {
    const $page = document.querySelector<HTMLElement>(
      `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.pageNumber}"]`,
    );

    if (!$page) {
      return;
    }

    const { height, width } = $page.getBoundingClientRect();

    const top = $page.getBoundingClientRect().top + window.scrollY;
    const left = $page.getBoundingClientRect().left + window.scrollX;

    // X and Y are percentages of the page's height and width
    const pageX = (field.pageX / 100) * width + left;
    const pageY = (field.pageY / 100) * height + top;

    const pageHeight = (field.pageHeight / 100) * height;
    const pageWidth = (field.pageWidth / 100) * width;

    setCoords({
      pageX: pageX,
      pageY: pageY,
      pageHeight: pageHeight,
      pageWidth: pageWidth,
    });
  }, [
    field.pageHeight,
    field.pageNumber,
    field.pageWidth,
    field.pageX,
    field.pageY,
  ]);

  useEffect(() => {
    calculateCoords();
  }, [calculateCoords]);

  useEffect(() => {
    const onResize = () => {
      calculateCoords();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [calculateCoords]);

  return createPortal(
    <div
      key={coords.pageX + coords.pageY + coords.pageHeight + coords.pageWidth}
      className={cn("z-20", {
        "pointer-events-none": passive,
        "pointer-events-none opacity-75": disabled,
        "z-10": !active || disabled,
      })}
      style={{
        position: "absolute",
        top: coords.pageY,
        left: coords.pageX,
        height: coords.pageHeight,
        width: coords.pageWidth,
      }}

    >
      <div className="text-foreground group flex justify-center items-center border-gray-100 bg-white text-center relative rounded-lg border-2 backdrop-blur-[2px]  bg-background h-full w-full border-primary">
        {!imageUrl && <p>{field.type}</p>}
        {
          imageUrl && <img src={imageUrl} className="absolute inset-0 object-contain" />
        }

      </div>
    </div>,
    container || document.body,
  );
};
