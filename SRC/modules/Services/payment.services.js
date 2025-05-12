import { paymentMethods } from "../../utils/enums.utils.js";

const processPayment = async (userId, amount, paymentMethod) => {
    try {
        if (!userId) {
            const error = new Error("User ID is required");
            error.statusCode = 400;
            throw error;
        }
        if (typeof amount !== "number" || amount < 0) {
            const error = new Error("Invalid payment amount");
            error.statusCode = 400;
            throw error;
        }
        if (!Object.values(paymentMethods).includes(paymentMethod)) {
            const error = new Error("Invalid payment method");
            error.statusCode = 400;
            throw error;
        }

        let paymentIntentId = null;
        let stripeClientSecret = null;

        if (paymentMethod === paymentMethods.paymob) {
            const error = new Error("Paymob is not available now");
            error.statusCode = 503;
            throw error;
        } else if (paymentMethod === paymentMethods.stripe) {

            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: "usd",
                metadata: { userId },
                automatic_payment_methods: {
                    enabled: true,
                },

                idempotencyKey: `${userId}-${Date.now()}`,
            });
            paymentIntentId = paymentIntent.id;
            stripeClientSecret = paymentIntent.client_secret;
        }

        return {
            paymentIntentId,
            stripeClientSecret,
        };
    } catch (error) {
        if (error.type === "StripeCardError") {
            error.message = `Payment failed: ${error.message}`;
            error.statusCode = 400;
        }
        error.statusCode = error.statusCode || 500;
        throw error;
    }
};