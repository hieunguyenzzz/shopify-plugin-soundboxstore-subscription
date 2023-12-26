"use client";

import { useCallback, useEffect, useState } from "react";

import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";

import { Button } from "@shopify/polaris";
import { PDF_VIEWER_PAGE_SELECTOR } from "~/lib/contants";
import { FieldType } from "~/lib/type";
import { cn } from "./lib/utils";
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
};

export const FieldItem = ({
  field,
  passive,
  disabled,
  minHeight: _minHeight,
  minWidth: _minWidth,
  onResize,
  onMove,
  onRemove,
}: FieldItemProps) => {
  const [active, setActive] = useState(false);
  const [coords, setCoords] = useState({
    pageX: 0,
    pageY: 0,
    pageHeight: 0,
    pageWidth: 0,
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
    <Rnd
      key={coords.pageX + coords.pageY + coords.pageHeight + coords.pageWidth}
      className={cn("z-20", {
        "pointer-events-none": passive,
        "pointer-events-none opacity-75": disabled,
        "z-10": !active || disabled,
      })}
      default={{
        x: coords.pageX,
        y: coords.pageY,
        height: coords.pageHeight,
        width: coords.pageWidth,
      }}
      bounds={`${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.pageNumber}"]`}
      onDragStart={() => setActive(true)}
      onResizeStart={() => setActive(true)}
      onResizeStop={(_e, _d, ref) => {
        setActive(false);
        onResize?.(ref);
      }}
      onDragStop={(_e, d) => {
        setActive(false);
        onMove?.(d.node);
      }}
    >
      <div className="text-foreground group flex justify-center items-center border-blue-600 bg-blue-100 text-center relative rounded-lg border-2 backdrop-blur-[2px]   bg-background h-full w-full border-primary">
        <p>{field.type}</p>
        <div
          style={{ position: "absolute", bottom: "100%", right: 0 }}
          className="py-2"
        >
          <Button
            fullWidth
            variant="plain"
            tone="critical"
            onClick={onRemove}
            accessibilityLabel="Remove"
          >
            Remove
          </Button>
        </div>
      </div>
    </Rnd>,
    document.body,
  );
};
