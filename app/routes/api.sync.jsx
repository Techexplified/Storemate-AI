// app/routes/api.sync.jsx
import { data } from "react-router";
import { authenticate } from "../shopify.server";
import { syncProducts } from "../lib/store-data.server";

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  try {
    await syncProducts(session.shop, admin);
    return data({ success: true, syncedAt: new Date() });
  } catch (e) {
    console.error("Sync error:", e);
    return data({ error: "Sync failed" }, { status: 500 });
  }
};