import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const {session} = await authenticate.admin(request);
  const shop = session.shop;

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "",shop };
};

export default function App() {
  const { apiKey, shop } = useLoaderData();
  const isonboarded = db.ChatbotConfig.findUnique({where:{shop : shop}});


  return (
    <AppProvider embedded apiKey={apiKey}>
      { isonboarded &&
      <s-app-nav>
        {/* <s-link href="/app">Home</s-link>
        <s-link href="/app/additional">Additional page</s-link> */}
        <s-link href="/app/dashboard">Dashboard</s-link>
        <s-link href="/app/settings">Settings</s-link>
      </s-app-nav>
      }
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
