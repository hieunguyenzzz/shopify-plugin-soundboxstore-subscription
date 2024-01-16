import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useNavigate, useSubmit } from "@remix-run/react";
import {
  Button,
  Card,
  Form, FormLayout,
  TextField
} from "@shopify/polaris";
import { useEffect, useState } from 'react';
import PageDefaultLayout from "~/_components/PageLayouts";
import { authenticate } from "~/shopify.server";

function FormOnSubmit() {
  const [months, setMonths] = useState("3");
  const [percent, setPercent] = useState("10");
  const actionData = useActionData<ActionFunctionArgs>();
  const submit = useSubmit()
  return (
    <Form onSubmit={() => {
      submit({ months, percent },
        { method: "post", encType: "application/json" })
    }}>
      <FormLayout>
        <FormLayout.Group>
          <TextField
            value={months}
            name="months"
            onChange={setMonths}
            label="Months"

            type="number"
            autoComplete="off"
          />
          <TextField
            name="percent"
            value={percent}
            onChange={setPercent}
            label="Percent"
            type="number"
            prefix="%"
            autoComplete="off"
          />
        </FormLayout.Group>
        <Button submit>Create</Button>
      </FormLayout>
    </Form>
  );
}
export const loader = async ({ request, }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { ping: "pong", };
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const body = await request.json();
  const { months, percent } = body;
  let price_rule = new admin.rest.resources.PriceRule({ session: session });
  price_rule.title = `Renting_${percent}%_off_${months}_months`;
  price_rule.target_type = "line_item";
  price_rule.target_selection = "entitled";
  price_rule.allocation_method = "across";
  price_rule.value_type = "percentage";
  price_rule.value = "-" + percent + ".0";
  price_rule.customer_selection = "all";
  price_rule.entitled_collection_ids = [
    424493285601
  ];
  price_rule.starts_at = new Date().toISOString();
  await price_rule.save({
    update: true,
  });
  return {
    price_rule: price_rule || null,
  }
}
export default function SettingPage() {
  const data = useActionData<typeof action>();
  const nava = useNavigate();
  useEffect(() => {
    if (data?.price_rule) {
      nava(`/app/discounts`)
    }
  }, [data?.price_rule])
  return (
    <PageDefaultLayout
      title={"Discounts"}
      backAction={{
        url: "/app/discounts",
      }}
    >
      <Card >
        <FormOnSubmit />
      </Card>
    </PageDefaultLayout>
  );
}
