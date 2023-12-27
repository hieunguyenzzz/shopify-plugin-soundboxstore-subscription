"use client";

import { BlockStack, Box, Card, Text } from "@shopify/polaris";
import { useCallback, useEffect, useRef, useState } from "react";
import { PDF_VIEWER_PAGE_SELECTOR } from "~/lib/contants";
import { getBoundingClientRect } from "~/lib/get-bounding-client-rect";
import { useDocumentElement } from "~/lib/hooks/use-document-element";
import { FRIENDLY_FIELD_TYPE, FieldType } from "~/lib/type";
import { FieldItem } from "./field-item";
import { cn } from "./lib/utils";
const DEFAULT_HEIGHT_PERCENT = 5;
const DEFAULT_WIDTH_PERCENT = 15;

const MIN_HEIGHT_PX = 60;
const MIN_WIDTH_PX = 120;
const SendStatus = {
  SENT: "SENT",
} as const;
function AddFields({
  onChange,
  defaultFields = [],
}: {
  onChange: (fields: FieldType[]) => void;
  defaultFields?: FieldType[];
}) {
  const [localFields, setLocalFields] = useState<FieldType[]>(defaultFields);
  const { isWithinPageBounds, getFieldPosition, getPage } =
    useDocumentElement();
  const [isFieldWithinBounds, setIsFieldWithinBounds] = useState(false);
  const [selectedField, setSelectedField] = useState<"signature" | null>(
  );
  const [selectedSigner, setSelectedSigner] = useState<any | null>({
    id: "signature",
  });
  const [coords, setCoords] = useState({
    x: 0,
    y: 0,
  });
  const fieldBounds = useRef({
    height: 0,
    width: 0,
  });

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      setIsFieldWithinBounds(
        isWithinPageBounds(
          event,
          PDF_VIEWER_PAGE_SELECTOR,
          fieldBounds.current.width,
          fieldBounds.current.height,
        ),
      );

      setCoords({
        x: event.clientX - fieldBounds.current.width / 2,
        y: event.clientY - fieldBounds.current.height / 2,
      });
    },
    [isWithinPageBounds],
  );

  const onMouseClick = useCallback(
    (event: MouseEvent) => {
      if (!selectedField || !selectedSigner) {
        return;
      }

      const $page = getPage(event, PDF_VIEWER_PAGE_SELECTOR);

      if (
        !$page ||
        !isWithinPageBounds(
          event,
          PDF_VIEWER_PAGE_SELECTOR,
          fieldBounds.current.width,
          fieldBounds.current.height,
        )
      ) {
        setSelectedField(null);
        return;
      }

      const { top, left, height, width } = getBoundingClientRect($page);

      const pageNumber = parseInt(
        $page.getAttribute("data-page-number") ?? "1",
        10,
      );

      // Calculate x and y as a percentage of the page width and height
      let pageX = ((event.pageX - left) / width) * 100;
      let pageY = ((event.pageY - top) / height) * 100;

      // Get the bounds as a percentage of the page width and height
      const fieldPageWidth = (fieldBounds.current.width / width) * 100;
      const fieldPageHeight = (fieldBounds.current.height / height) * 100;

      // And center it based on the bounds
      pageX -= fieldPageWidth / 2;
      pageY -= fieldPageHeight / 2;

      setLocalFields((fields) => [
        ...fields,
        {
          formId: "nanoid(12)",
          type: selectedField,
          pageNumber,
          pageX,
          pageY,
          pageWidth: fieldPageWidth,
          pageHeight: fieldPageHeight,
        } as FieldType,
      ]);

      setIsFieldWithinBounds(false);
      setSelectedField(null);
    },
    [isWithinPageBounds, selectedField, selectedSigner, getPage],
  );

  useEffect(() => {
    if (selectedField) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseClick);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseClick);
    };
  }, [onMouseClick, onMouseMove, selectedField]);
  useEffect(() => {
    onChange(localFields);
  }, [localFields]);
  useEffect(() => {
    const observer = new MutationObserver((_mutations) => {
      const $page = document.querySelector(PDF_VIEWER_PAGE_SELECTOR);

      if (!$page) {
        return;
      }

      const { height, width } = $page.getBoundingClientRect();

      fieldBounds.current = {
        height: Math.max(
          height * (DEFAULT_HEIGHT_PERCENT / 100),
          MIN_HEIGHT_PX,
        ),
        width: Math.max(width * (DEFAULT_WIDTH_PERCENT / 100), MIN_WIDTH_PX),
      };
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);
  const onFieldResize = useCallback(
    (node: HTMLElement, index: number) => {
      setLocalFields((fields) => {
        const updatedFields = [...fields];
        let field = updatedFields[index];
        const $page = window.document.querySelector<HTMLElement>(
          `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.pageNumber}"]`,
        );

        if (!$page) {
          return fields;
        }

        const {
          x: pageX,
          y: pageY,
          width: pageWidth,
          height: pageHeight,
        } = getFieldPosition($page, node);
        updatedFields[index] = {
          ...updatedFields[index],
          pageX,
          pageY,
          pageWidth,
          pageHeight,
        };
        return updatedFields;
      });
    },
    [getFieldPosition],
  );
  const onFieldMove = useCallback(
    (node: HTMLElement, index: number) => {
      setLocalFields((fields) => {
        const newFields = [...fields];
        const field = newFields[index];

        const $page = window.document.querySelector<HTMLElement>(
          `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.pageNumber}"]`,
        );

        if (!$page) {
          return fields;
        }

        const { x: pageX, y: pageY } = getFieldPosition($page, node);

        newFields[index] = {
          ...field,
          pageX,
          pageY,
        };
        return newFields;
      });
    },

    [getFieldPosition],
  );
  return (
    <BlockStack gap="200">
      <Text as="h3" variant="headingSm" fontWeight="medium">
        Add Fields
      </Text>
      <Text as="p" variant="bodyMd">
        Add all relevant fields for each recipient.
      </Text>
      <button
        style={{ position: "relative", padding: "0" }}
        disabled={
          !selectedSigner || selectedSigner?.sendStatus === SendStatus.SENT
        }
        onClick={() => setSelectedField("signature")}
        onMouseDown={() => setSelectedField("signature")}
        data-selected={selectedField === "signature" ? true : undefined}
      >
        <Card>
          <Box padding={"400"}>
            <Text as="span" alignment="center" variant="headingXl">
              Signature
            </Text>
          </Box>
        </Card>
      </button>
      {selectedField && (
        <div
          className={cn(
            "bg-background pointer-events-none fixed z-50 cursor-pointer transition-opacity",
            {
              "border-primary": isFieldWithinBounds,
              "opacity-50": !isFieldWithinBounds,
            },
          )}
          style={{
            position: "fixed",
            cursor: "pointer",
            pointerEvents: "none",
            top: coords.y,
            left: coords.x,
            height: fieldBounds.current.height,
            width: fieldBounds.current.width,
          }}
        >
          <Card>
            <Box padding={"150"}>{FRIENDLY_FIELD_TYPE[selectedField]}</Box>
          </Card>
        </div>
      )}
      {localFields?.map((field, index) => (
        <FieldItem
          key={index}
          field={field}
          minHeight={fieldBounds.current.height}
          minWidth={fieldBounds.current.width}
          passive={isFieldWithinBounds && !!selectedField}
          onResize={(options) => onFieldResize(options, index)}
          onMove={(options) => onFieldMove(options, index)}
          onRemove={() => {
            setLocalFields((fields) => {
              const newFields = [...fields];
              newFields.splice(index, 1);
              return newFields;
            });
          }}
        />
      ))}
    </BlockStack>
  );
}

export default AddFields;
