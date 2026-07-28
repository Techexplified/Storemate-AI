// app/routes/app.api.check-embed.jsx
import { data } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;
    const themeCustomizerUrl = `https://admin.shopify.com/store/${shop.split('.')[0]}/themes/current/editor?context=apps`;

    let isEmbedded = false;

    try {
        const themeResponse = await admin.graphql(`
            query {
                themes(first: 10) {
                    nodes { id role }
                }
            }
        `);

        const themeData = await themeResponse.json();
        const mainTheme = themeData?.data?.themes?.nodes?.find(t => t.role === "MAIN");

        if (mainTheme) {
            const assetResponse = await admin.graphql(`
                query getThemeFile($id: ID!) {
                    theme(id: $id) {
                        files(filenames: ["config/settings_data.json"], first: 1) {
                            nodes {
                                body {
                                    ... on OnlineStoreThemeFileBodyText { content }
                                }
                            }
                        }
                    }
                }
            `, { variables: { id: mainTheme.id } });

            const assetData = await assetResponse.json();
            const rawContent = assetData?.data?.theme?.files?.nodes?.[0]?.body?.content ?? "";

            if (rawContent) {
                const cleaned = rawContent.replace(/\/\*[\s\S]*?\*\//, "");
                const parsedSettings = JSON.parse(cleaned);
                const blocks = parsedSettings?.current?.blocks || {};

                isEmbedded = Object.values(blocks).some(
                    (block) => block?.type?.includes("storemate") && block?.disabled !== true
                );
            }
        }
    } catch (e) {
        console.error("Embed verification failed:", e);
    }

    return data({ isEmbedded, themeCustomizerUrl });
};