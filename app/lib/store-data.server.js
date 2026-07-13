// app/lib/store-data.server.js
import db from "../db.server";

async function fetchProducts(admin) {
  const response = await admin.graphql(`
    {
      products(first: 250) {
        edges {
          node {
            title
            description
            variants(first: 10) {
              edges {
                node {
                  title
                  price
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `);
  const json = await response.json();
  return json?.data?.products?.edges?.map(({ node }) => {
    const variants = node.variants.edges.map(({ node: v }) =>
      `${v.title} - $${v.price}${v.availableForSale ? "" : " (out of stock)"}`
    ).join(", ");
    return `Product: ${node.title}\nDescription: ${node.description || "N/A"}\nVariants: ${variants}`;
  }).join("\n\n") || "";
}

export async function lookupOrder(shop, orderNumber, email) {
  const session = await db.session.findFirst({
    where: { shop },
    select: { accessToken: true },
  });

  if (!session?.accessToken) return null;

  const res = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": session.accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query LookupOrder($query: String!) {
          orders(first: 1, query: $query) {
            nodes {
              name
              email
              createdAt
              currentTotalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              displayFinancialStatus
              displayFulfillmentStatus
              lineItems(first: 50) {
                nodes {
                  name
                  quantity
                }
              }
              fulfillments {
                trackingInfo {
                  number
                  url
                }
              }
            }
          }
        }
      `,
      variables: {
        query: `name:#${orderNumber}`,
      },
    }),
  });

  if (!res.ok) return null;

  const { data } = await res.json();

  const order = data?.orders?.nodes?.[0];
  if (!order) return null;

  console.log(JSON.stringify(data, null, 2));
console.log("Expected email:", email);
console.log("Order email:", order?.email);

  // Verify email ourselves
  if ((order.email || "").toLowerCase() !== email.toLowerCase()) {
    return null;
  }

  return {
    number: order.name,
    status: order.displayFulfillmentStatus,
    financialStatus: order.displayFinancialStatus,
    createdAt: new Date(order.createdAt).toDateString(),
    total: `${order.currentTotalPriceSet.shopMoney.currencyCode} ${order.currentTotalPriceSet.shopMoney.amount}`,
    items: order.lineItems.nodes
      .map(i => `${i.name} x${i.quantity}`)
      .join(", "),
    trackingNumbers: order.fulfillments
      .flatMap(f => f.trackingInfo)
      .map(t => t.number)
      .filter(Boolean)
      .join(", ") || null,
    trackingUrls: order.fulfillments
      .flatMap(f => f.trackingInfo)
      .map(t => t.url)
      .filter(Boolean)
      .join(", ") || null,
  };
}

export async function syncProducts(shop, admin) {
  const productText = await fetchProducts(admin);
  await db.merchantConfig.upsert({
    where: { shop },
    update: { productCache: productText, cacheSyncedAt: new Date() },
    create: { shop, productCache: productText, cacheSyncedAt: new Date() },
  });
  return productText;
}

export async function buildSystemPrompt(shop, admin, config) {
  let productText = "";
  const merchant = await db.merchantConfig.findUnique({ where: { shop } });

  const cacheExpired = !merchant?.cacheSyncedAt ||
    (Date.now() - new Date(merchant.cacheSyncedAt).getTime()) > 1000 * 60 * 60 * 24;

  if (cacheExpired && admin) {
    productText = await fetchProducts(admin);
    await db.merchantConfig.upsert({
      where: { shop },
      update: { productCache: productText, cacheSyncedAt: new Date() },
      create: { shop, productCache: productText, cacheSyncedAt: new Date() },
    });
  } else {
    productText = merchant?.productCache || "";
  }

  const faqs = config.capFaqs ? await db.faq.findMany({ where: { shop } }) : [];
  const faqText = faqs.length ? faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n") : "";

  const policies = config.capPolicies ? await db.policy.findMany({ where: { shop } }) : [];
  const policyText = policies.length ? policies.map(p => `${p.name}:\n${p.text}`).join("\n\n") : "";

  return `
You are ${config.botName}, a helpful store assistant. Tone: ${config.personalityTone}.
${config.language ? `Always respond in: ${config.language}` : ""}

${config.capProducts && productText ? `PRODUCTS:\n${productText}` : ""}
${policyText ? `POLICIES:\n${policyText}` : ""}
${faqText ? `FAQs:\n${faqText}` : ""}
${merchant?.supportEmail || merchant?.supportUrl ? `SUPPORT CONTACT:\nEmail: ${merchant.supportEmail || "N/A"} | URL: ${merchant.supportUrl || "N/A"}` : ""}

${!config.capProducts ? `Do NOT answer product questions. Tell customer you cannot help with that.` : ""}
${!config.capPolicies ? `Do NOT answer policy, shipping or returns questions. Tell customer you cannot help with that.` : ""}
${!config.capFaqs ? `Do NOT answer FAQ questions. Tell customer you cannot help with that.` : ""}
${config.capOrderTracking
  ? `ORDER TRACKING:\nIf a customer wants to track an order, ask for their order number (e.g. #1234) and the email used at checkout, if not already given. Once you have both, tell them: "Let me look that up for you." Do not attempt to guess order status yourself.`
  : `Do NOT help with order tracking. Tell customer you cannot help with that.`}

If you cannot answer, direct the customer to support: Email: ${merchant?.supportEmail || "N/A"} | URL: ${merchant?.supportUrl || "N/A"}
`.trim();
}