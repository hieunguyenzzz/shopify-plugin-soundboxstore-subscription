import { BlockStack, Page, PageProps } from "@shopify/polaris";

export default function PageDefaultLayout({
  backAction,
  children,
  ...props
}: Omit<PageProps, 'backAction'> & {
  backAction?: PageProps['backAction']
}) {
  return (
    <Page title="Renting Products" backAction={backAction || {
      url: '/app',
    }} {...props}>
      <BlockStack gap={{ xs: "800", sm: "400" }}>
        {children}
      </BlockStack>
    </Page>
  )
}
