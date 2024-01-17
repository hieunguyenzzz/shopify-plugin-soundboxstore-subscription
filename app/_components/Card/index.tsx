import {
  BlockStack,
  Box,
  Card,
  Text
} from "@shopify/polaris";

export default function BasicCard({ children, title }: { children: React.ReactNode, title: string }) {
  return (
    <Card padding={"0"}>
      <BlockStack >
        <Box padding={"300"} background="bg-surface-brand">
          <Text variant="headingMd" as="h2">{title}</Text>
        </Box>
        <Box >
          {children}
        </Box>
      </BlockStack>
    </Card>
  );
}
