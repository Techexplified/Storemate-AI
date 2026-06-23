// app/routes/app.dashboard.jsx
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [config, merchant] = await Promise.all([
    db.chatbotConfig.findUnique({ where: { shop } }),
    db.merchantConfig.findUnique({ where: { shop } }),
  ]);

  return { shop, config, merchant };
};

export default function Dashboard() {
  const { shop, config, merchant } = useLoaderData();

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Dashboard placeholder</h1>
      <p>Shop: {shop}</p>
      <p>Bot: {config?.botName}</p>
    </div>
  );
}