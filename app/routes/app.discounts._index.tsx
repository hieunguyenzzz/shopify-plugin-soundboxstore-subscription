import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  json,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  EmptyState,
  FormLayout,
  InlineStack,
  Popover,
  ResourceItem,
  ResourceList,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import { CollectionsMajor, DiscountsMajor } from "@shopify/polaris-icons";
import { useField, useForm } from "@shopify/react-form";
import { useState } from "react";
import BasicCard from "~/_components/Card";
import PageDefaultLayout from "~/_components/PageLayouts";
import { createRentingDiscounts } from "~/_helpers/mutations";
import { deleteRentingDiscounts } from "~/_helpers/mutations/deleteDiscounts";
import { getAllRetingDiscounts } from "~/_helpers/query";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const {
    data: { shop },
  } = await admin
    .graphql(
      `
  #graphql
  {
    shop{
      id
      metafields(namespace:"renting",first:99){
        nodes{
          id
          key
          namespace
          value
        }
      }
    }
  }
  `,
      {},
    )
    .then((res) => res.json());
  const collectionid = shop?.metafields?.nodes?.find(
    (item: any) => item?.key === "collection",
  )?.value;
  const optionsStr = shop?.metafields?.nodes?.find(
    (item: any) => item?.key === "options",
  )?.value;
  const {
    data: { collection },
  } = await admin
    .graphql(
      `
  #graphql
  {
    collection(id:"${collectionid}"){
      id
      title
      handle
      image{
        url
      }
    }
  }
  `,
      {},
    )
    .then((res) => res.json())
    .catch(() => ({ data: {} }));
  const data = await getAllRetingDiscounts({ admin, session })();
  let discounts: {
    id: string;
    name: string;
  }[] = data?.discountNodes?.edges?.map((item: any) => {
    return {
      id: item?.node?.id,
      name: item?.node?.discount?.title,
      ...item?.node?.discount,
    };
  });
  return json({
    shop,
    discounts,
    data,
    options: optionsStr ? JSON.parse(optionsStr) : [],
    collection,
    collectionid,
    priceRules: await admin.rest.resources.PriceRule.all({
      session: session,
    }).then((res) => res.data),
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { collection, renting } = await request.json();
  const {
    data: [{ id }],
  } = await admin.rest.resources.Shop.all({
    session: session,
  });
  const res = await admin
    .graphql(
      `#graphql
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            key
            namespace
            type
            value
            owner {
              __typename
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              ownerId: `gid://shopify/Shop/${id}`,
              namespace: "renting",
              key: "collection",
              value: collection,
              type: "single_line_text_field",
            },
            renting?.options && {
              ownerId: `gid://shopify/Shop/${id}`,
              namespace: "renting",
              key: "options",
              value: JSON.stringify(renting.options),
              type: "single_line_text_field",
            },
          ].filter(Boolean),
        },
      },
    )
    .then((res) => res.json());
  const data = await getAllRetingDiscounts({ admin, session })();
  let discountIds: string[] = data?.discountNodes?.edges?.map((item: any) => {
    return item?.node?.id;
  });
  if (discountIds.length > 0) {
    let deleteres = await deleteRentingDiscounts({ admin, session })({
      ids: discountIds,
    });
    console.log({ deleteres });
  }
  let validOptions =
    renting?.options?.filter(
      (item: { percent: any; months: string }) =>
        item.percent &&
        item?.percent !== "" &&
        item?.percent !== "0" &&
        item.percent !== 0,
    ) || [];
  let newdiscounts = await createRentingDiscounts({
    admin,
    session,
  })({
    collectionId: collection,
    options: validOptions,
  });
  return {
    discounts: newdiscounts,
    shopId: id,
    renting,
    res,
  };
};
export default function RentingPage() {
  const { discounts, data, shop, collection, options, priceRules, ...rest } =
    useLoaderData<typeof loader>();
  console.log({ discounts, data, shop, collection, options, ...rest });
  const navigation = useNavigation();
  const submit = useSubmit();
  const { fields, submit: submitForm } = useForm({
    fields: {
      collection: useField(""),
      options: useField(
        (options ||
          ([])) as {
            percent: string;
            months: string;
          }[],
      ),
    },
    onSubmit: async (form) => {
      submit(
        {
          collection: collection?.id,
          renting: {
            options: form.options?.sort((a, b) => Number(a.months) - Number(b.months)),
            collection: collection?.id,
          },
        },
        { method: "post", encType: "application/json" },
      );
      return { status: "success" };
    },
  });
  const handleSelectionChange = async () => {
    const selection = await shopify.resourcePicker({
      type: "collection",
      options: {
        selectMultiple: false,
      },
    });
    const collectionId = selection?.[0]?.id;
    if (!collectionId) return;
    submit(
      {
        collection: collectionId,
      },
      { method: "post", encType: "application/json" },
    );
    fields.collection?.onChange(collectionId);
  };
  const loading =
    navigation.state === "loading" || navigation.state === "submitting";
  return (
    <PageDefaultLayout
      title={"Discounts"}
      backAction={{
        url: "/app",
      }}
    >
      <BlockStack gap={"400"}>
        <BasicCard title="Collection">
          <ResourceList
            loading={loading}
            resourceName={{ singular: "collection", plural: "collections" }}
            items={
              [collection].filter(Boolean) as {
                id: string;
                title: string;
                handle: string;
                image: {
                  url: string;
                };
              }[]
            }
            emptyState={
              <EmptyState
                heading="Please select a collection"
                action={{
                  content: "Select Collection",
                  onAction: handleSelectionChange,
                }}
                image="https://cdn.shopify.com/s/files/1/2376/3301/products/emptystate-files.png"
              >
                <p>No collection selected</p>
              </EmptyState>
            }
            alternateTool={
              <Button onClick={handleSelectionChange}>Change Collection</Button>
            }
            renderItem={(item) => {
              const { id, title: name, image } = item;
              const media = (
                <Thumbnail alt="" size="small" source={CollectionsMajor} />
              );
              return (
                <ResourceItem
                  id={id}
                  url={`#`}
                  media={media}
                  accessibilityLabel={`View details for ${name}`}
                >
                  <Text variant="bodyMd" fontWeight="bold" as="h3">
                    {name}
                  </Text>
                </ResourceItem>
              );
            }}
          />
        </BasicCard>
        <BasicCard title="Options">
          <ResourceList
            loading={loading}
            resourceName={{ singular: "option", plural: "options" }}
            items={
              fields.options?.value
                ? fields.options?.value
                  .map(
                    (
                      item: { percent: string; months: string },
                      i: number,
                    ) => {
                      let id = i;
                      return {
                        id: id,
                        index: i,
                        name: id,
                        url: "#",
                        ...item,
                      };
                    },
                  )
                  .sort((a, b) => Number(a.months) - Number(b.months))
                : []
            }
            emptyState={
              <EmptyState image="https://cdn.shopify.com/s/files/1/2376/3301/products/emptystate-files.png">
                <Box paddingBlock={"400"}>
                  <Text as="h3" fontWeight="bold" alignment="start">
                    Create First Option
                  </Text>
                </Box>
                <NewOptionForm
                  onSubmit={(e) => {
                    console.log({ e });
                    fields.options?.onChange([...fields.options?.value, e]);
                  }}
                />
              </EmptyState>
            }
            alternateTool={
              <InlineStack gap={"300"}>
                <PopoverNewOption
                  onSubmit={(f) =>
                    fields.options.onChange([...fields.options?.value, f])
                  }
                />
                <Button
                  onClick={() => {
                    submitForm();
                  }}
                  variant="primary"
                >
                  Save
                </Button>
              </InlineStack>
            }
            renderItem={(item) => {
              const { id, name, url, percent, months, index } = item;
              const media = (
                <Thumbnail alt="" size="small" source={DiscountsMajor} />
              );
              return (
                <ResourceItem
                  id={id}
                  onClick={() => { }}
                  media={media}
                  accessibilityLabel={`View details for ${name}`}
                >
                  <FormLayout>
                    <FormLayout.Group>
                      <TextField
                        type="number"
                        label="Moths"
                        value={fields.options?.value[index].months}
                        onChange={() => {
                          let newFields = [...fields.options?.value];
                          newFields[index].months = months;
                          fields.options?.onChange(newFields);
                        }}
                        autoComplete="off"
                      />
                      <TextField
                        type="number"
                        value={fields.options?.value[index].percent}
                        label="Percent"
                        onChange={() => {
                          let newFields = [...fields.options?.value];
                          newFields[index].percent = percent;
                          fields.options?.onChange(newFields);
                        }}
                        autoComplete="off"
                      />
                    </FormLayout.Group>
                    <InlineStack align="end">
                      <Button
                        onClick={() => {
                          let newFields = [...fields.options?.value];
                          newFields.splice(index, 1);
                          fields.options?.onChange(newFields);
                        }}
                        tone="critical"
                        variant="primary"
                      >
                        Remove
                      </Button>
                    </InlineStack>
                  </FormLayout>
                </ResourceItem>
              );
            }}
            showHeader
            totalItemsCount={discounts.length}
          />
        </BasicCard>
        {/* <BasicCard title="Discounts">
          <ResourceList
            loading={loading}
            resourceName={{ singular: "discount", plural: "discounts" }}
            items={
              discounts
                ? discounts
                    .map((item, i: number) => {
                      return {
                        index: i,
                        url: "#",
                        ...item,
                      };
                    })
                    .sort((a, b) => Number(a.months) - Number(b.months))
                : []
            }
            emptyState={
              <EmptyState image="https://cdn.shopify.com/s/files/1/2376/3301/products/emptystate-files.png">
                <Box paddingBlock={"400"}>
                  <Text as="h3" fontWeight="bold" alignment="start">
                    No discount created
                  </Text>
                </Box>
              </EmptyState>
            }
            renderItem={(item) => {
              const { id, name } = item;
              const media = (
                <Thumbnail alt="" size="small" source={DiscountsMajor} />
              );
              return (
                <ResourceItem
                  id={id + ""}
                  onClick={() => {}}
                  media={media}
                  accessibilityLabel={`View details for ${name}`}
                >
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd">
                      {name}
                    </Text>
                  </InlineStack>
                  <Text as="p" variant="bodyMd">
                    {id}
                  </Text>
                </ResourceItem>
              );
            }}
            showHeader
            totalItemsCount={discounts.length}
          />
        </BasicCard> */}
      </BlockStack>
    </PageDefaultLayout>
  );
}

function PopoverNewOption({
  onSubmit,
}: {
  onSubmit: (a: { percent: string; months: string }) => void;
}) {
  const [active, setActive] = useState(false);

  return (
    <Popover
      active={active}
      activator={<Button onClick={() => setActive(true)}>New Option</Button>}
      onClose={() => setActive(false)}
      ariaHaspopup={false}
      sectioned
    >
      <NewOptionForm
        onSubmit={(f) => {
          onSubmit(f);
          setActive(false);
        }}
      />
    </Popover>
  );
}
const NewOptionForm = ({
  onSubmit,
}: {
  onSubmit: (a: { percent: string; months: string }) => void;
}) => {
  const {
    fields,
    submit: submitForm,
    submitting,
    dirty,
    reset,
    submitErrors,
    makeClean,
  } = useForm({
    fields: {
      percent: useField("0"),
      months: useField(""),
    },

    onSubmit: async (form) => {
      if (form.months === "")
        return {
          status: "fail",
          errors: [{ message: "Please fill all fields" }],
        };
      onSubmit({
        percent: form.percent || "0",
        months: form.months,
      });
      reset();
      return { status: "success" };
    },
  });
  const loading = submitting ? <p className="loading">loading...</p> : null;
  const errors =
    submitErrors.length > 0 ? (
      <Banner tone="critical" hideIcon>
        <p className="error">{submitErrors.map((s) => s.message).join("")}</p>
      </Banner>
    ) : null;
  return (
    <FormLayout>
      {loading}
      {errors}
      <TextField
        label="Months"
        type="number"
        {...fields.months}
        autoComplete="off"
      />
      <TextField
        label="Percent"
        type="number"
        {...fields.percent}
        autoComplete="off"
      />
      <Button
        fullWidth
        variant="primary"
        size="slim"
        onClick={() => {
          submitForm();
        }}
      >
        Add
      </Button>
    </FormLayout>
  );
};
