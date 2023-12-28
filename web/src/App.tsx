import { DownloadIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FieldItem } from "./components/field-item";
import PDFViewer from "./components/pdf-viewer";
import { SignaturePad } from "./components/signature-pad";
import { PDF_VIEWER_PAGE_SELECTOR } from "./lib/contants";
import { useDocumentElement } from "./lib/hooks/use-document-element";
const DEFAULT_HEIGHT_PERCENT = 5;
const DEFAULT_WIDTH_PERCENT = 15;

const MIN_HEIGHT_PX = 60;
const MIN_WIDTH_PX = 120;

function App() {
  const [fields, setFields] = useState([
    {
      formId: "nanoid(12)",
      type: "signature",
      pageNumber: 1,
      pageX: 67.11783439490446,
      pageY: 78.18471337579618,
      pageWidth: 19.10828025477707,
      pageHeight: 9.554140127388536,
    },
    {
      formId: "nanoid(12)",
      type: "signature",
      pageNumber: 8,
      pageX: 69.34713375796179,
      pageY: 51.59235668789809,
      pageWidth: 19.10828025477707,
      pageHeight: 19.10828025477707,
    },
  ]);
  const { isWithinPageBounds, getFieldPosition, getPage } =
    useDocumentElement();
  const [isFieldWithinBounds, setIsFieldWithinBounds] = useState(false);
  const [selectedField, setSelectedField] = useState<"signature" | null>();
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
      setFields((fields) => {
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
  const [imageData, setImageData] = useState<string | null>();
  const containerRef = useRef<HTMLDivElement>();
  const [doc, setDocument] = useState<any>();
  useEffect(() => {
    fetch("https://lender-secondary-voters-mariah.trycloudflare.com/customer/signing",)
      .then(res => res.json())
      .then(data => {
        console.log(data)
        console.log(JSON.parse(data.signature.data))
      })
  }, [])
  const [url, setUrl] = useState<string>()
  console.log({ url })
  if (url) {
    return <>
      <div
        className={
          "absolute inset-0 h-screen flex justify-center max-w-full items-center p-6 "
        }
      >
        <div key={url}
          ref={containerRef}
          className="bg-background  gap-6 overflow-y-scroll overflow-x-hidden p-6 w-full h-full text-foreground group relative rounded-lg border-2 backdrop-blur-[2px] gradient-border-mask dark:gradient-border-mask before:pointer-events-none before:absolute before:-inset-[2px] before:rounded-lg before:p-[2px] before:[background:linear-gradient(var(--card-gradient-degrees),theme(colors.documenso.DEFAULT/70%)_5%,theme(colors.border/80%)_30%)] shadow-[0_0_0_4px_theme(colors.gray.100/70%),0_0_0_1px_theme(colors.gray.100/70%),0_0_0_0.5px_theme(colors.blue.DEFAULT/70%)] dark:shadow-[0] focus-visible:ring-ring ring-offset-background  flex-1 cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 aria-disabled:pointer-events-none aria-disabled:opacity-60 min-h-[40vh]"
        >
          <div className="w-full min-h-full justify-center flex gap-6 mx-auto">
            <div className="flex-1 rounded-lg max-w-4xl w-0 ">
              <PDFViewer
                className=" w-full overflow-hidden rounded"
                documentData={{
                  data: url,
                  type: "S3_PATH",
                  id: url,
                }}
                onDocumentLoad={doc => {
                  setTimeout(() => {
                    setDocument(doc)
                  }, 1000)
                }}
              />

            </div>
            <div className="w-1/3 max-w-[400px] bg bg-gray-100 h-full rounded-lg p-6 sticky top-0">
              <div className="flex flex-1 flex-col">
                <div>
                  <h3 className="text-foreground text-2xl font-semibold">
                    Complete
                  </h3>

                  <hr className="border-border mb-8 mt-4" />
                  <div className="relative w-full rounded-lg bg-white ">
                    <SignaturePad
                      className="h-44 w-full p-6"
                      defaultValue={undefined}
                      onChange={setImageData}
                    />
                  </div>
                  <hr className="border-border mb-8 mt-4" />
                  <div className="flex flex-col gap-4 md:flex-row">
                    <a
                      href={url}
                      target="_blank"
                      download={true}
                      className="inline-flex gap-1 items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-500 text-blue-100 hover:bg-blue-600 h-11 px-8 rounded-md w-full"
                      type="button"
                      aria-haspopup="dialog"
                      aria-expanded="false"
                      aria-controls="radix-:Raijnlfff9ta:"
                      data-state="closed"
                    >
                      <DownloadIcon />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  }
  return (
    <>
      <div
        className={
          "absolute inset-0 h-screen flex justify-center max-w-full items-center p-6 "
        }
      >
        <div
          ref={containerRef}
          className="bg-background  gap-6 overflow-y-scroll overflow-x-hidden p-6 w-full h-full text-foreground group relative rounded-lg border-2 backdrop-blur-[2px] gradient-border-mask dark:gradient-border-mask before:pointer-events-none before:absolute before:-inset-[2px] before:rounded-lg before:p-[2px] before:[background:linear-gradient(var(--card-gradient-degrees),theme(colors.documenso.DEFAULT/70%)_5%,theme(colors.border/80%)_30%)] shadow-[0_0_0_4px_theme(colors.gray.100/70%),0_0_0_1px_theme(colors.gray.100/70%),0_0_0_0.5px_theme(colors.blue.DEFAULT/70%)] dark:shadow-[0] focus-visible:ring-ring ring-offset-background  flex-1 cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 aria-disabled:pointer-events-none aria-disabled:opacity-60 min-h-[40vh]"
        >
          <div className="w-full min-h-full justify-center flex gap-6 mx-auto">
            <div className="flex-1 rounded-lg max-w-4xl w-0 ">
              <PDFViewer
                className=" w-full overflow-hidden rounded"
                documentData={{
                  data: "https://cdn.shopify.com/s/files/1/0661/3034/6209/files/Brochure-Digital-Format-NB.pdf?v=1703587780",
                  type: "S3_PATH",
                  id: "https://cdn.shopify.com/s/files/1/0661/3034/6209/files/Brochure-Digital-Format-NB.pdf?v=1703587780",
                }}
                onDocumentLoad={doc => {
                  setTimeout(() => {
                    setDocument(doc)
                  }, 1000)
                }}
              />
              {doc && fields?.map((field, index) => (
                <FieldItem
                  container={containerRef.current}
                  imageUrl={imageData}
                  key={index}
                  field={field}
                  minHeight={fieldBounds.current.height}
                  minWidth={fieldBounds.current.width}
                  passive={isFieldWithinBounds && !!selectedField}
                  onResize={(options) => onFieldResize(options, index)}
                />
              ))}
            </div>
            <div className="w-1/3 max-w-[400px] bg bg-gray-100 h-full rounded-lg p-6 sticky top-0">
              <div className="flex flex-1 flex-col">
                <div>
                  <h3 className="text-foreground text-2xl font-semibold">
                    Sign Document
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Please review the document before signing.
                  </p>
                  <hr className="border-border mb-8 mt-4" />
                  <div className="relative w-full rounded-lg bg-white ">
                    <SignaturePad
                      className="h-44 w-full p-6"
                      defaultValue={undefined}
                      onChange={setImageData}
                    />
                  </div>
                  <hr className="border-border mb-8 mt-4" />
                  <div className="flex flex-col gap-4 md:flex-row">
                    <button
                      className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background text-secondary-foreground h-11 px-8 rounded-md dark:bg-muted dark:hover:bg-muted/80 w-full bg-black/5 hover:bg-black/10"
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async e => {
                        e.preventDefault()
                        const data = await fetch("https://lender-secondary-voters-mariah.trycloudflare.com/customer/signing", {
                          body: JSON.stringify({
                            id: Date.now() + '',
                            documentId: "https://cdn.shopify.com/s/files/1/0661/3034/6209/files/Brochure-Digital-Format-NB.pdf?v=1703587780",
                            signerId: "signature",
                            fields: fields,
                            signature: imageData
                          }),
                          headers: {
                            "Content-Type": "application/json"
                          },
                          method: "POST"
                        }).then(res => res.json())
                        console.log('==>', data)
                        let id = data?.response?.id
                        const url = `https://lender-secondary-voters-mariah.trycloudflare.com/customer/signing?id=${id}`
                        setUrl(url)
                      }}
                      className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-500 text-blue-100 hover:bg-blue-600 h-11 px-8 rounded-md w-full"
                      type="button"
                      aria-haspopup="dialog"
                      aria-expanded="false"
                      aria-controls="radix-:Raijnlfff9ta:"
                      data-state="closed"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
