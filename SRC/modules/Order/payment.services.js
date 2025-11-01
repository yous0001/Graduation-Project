import { paymentMethods } from "../../utils/enums.utils.js";
import paymentConfig from "./options/payment.config.js";

const processPayment = async (userId, amount, paymentMethod) => {
    try {
        if (!userId) {
            const error = new Error("User ID is required");
            error.statusCode = paymentConfig.errorCodes.invalidPayment;
            throw error;
        }
        if (typeof amount !== "number" || amount < 0) {
            const error = new Error("Invalid payment amount");
            error.statusCode = paymentConfig.errorCodes.invalidPayment;
            throw error;
        }
        if (!Object.values(paymentMethods).includes(paymentMethod)) {
            const error = new Error("Invalid payment method");
            error.statusCode = paymentConfig.errorCodes.invalidPayment;
            throw error;
        }

        let paymentIntentId = null;
        let stripeClientSecret = null;

        if (paymentMethod === paymentMethods.paymob) {
            const error = new Error("Paymob is not available now");
            error.statusCode = paymentConfig.errorCodes.serviceUnavailable;
            throw error;
        } else if (paymentMethod === paymentMethods.stripe) {

            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * paymentConfig.stripe.multiplier),
                currency: paymentConfig.stripe.fallbackCurrency.toLowerCase(),
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
            error.statusCode = paymentConfig.errorCodes.paymentFailed;
        }
        error.statusCode = error.statusCode || 500;
        throw error;
    }
};