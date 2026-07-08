import { authenticate } from "../shopify.server";
import { syncProducts } from "../lib/store-data.server";

export const action = async ({ request }) => {
  const { shop, admin } = await authenticate.webhook(request);
  await syncProducts(shop, admin);
  return new Response("OK", { status: 200 });
};