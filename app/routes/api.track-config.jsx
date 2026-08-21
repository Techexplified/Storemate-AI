import { data } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const DEFAULT_TRACK_CONFIG = {
    contactMethod: "email",
    heading: "Track Your Order",
    description: "Enter your order details to check the latest order status.",
    orderPlaceholder: "Order number (e.g. #1020)",
    contactPlaceholder: "Email used at checkout",
    
    buttonText: "Track Order",
    successMessage: "We've found your order.",
    errorMessage: "We couldn't find an order with those details. Please check and try again.",
    showEstimatedDelivery: true,
    showFulfillmentStatus: true,
    showTrackingNumber: true,
    showCourierName: true,
    showTrackingLink: true,
};

export async function loader({ request }) {
    const { session } = await authenticate.admin(request);
    const config = await db.chatbotConfig.findUnique({ where: { shop: session.shop } });
    const trackConfig = config?.orderTrackingConfig || DEFAULT_TRACK_CONFIG;
    return data({ trackConfig });
}

export async function action({request}){
    const {session} = await authenticate.admin(request);
    const body = await request.json();

    await db.chatbotConfig.upsert({
        where : {shop: session.shop},
        update: {orderTrackingConfig : body},
        create: {shop: session.shop, botName: "Aria", orderTrackingConfig: body},
    });

    return data({success: true});
}