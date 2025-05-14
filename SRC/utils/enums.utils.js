export const Badges = {
    new: "New",
    trending: "Trending",
    best_recipe: "best recipe",
};
export const discountTypes={
    percentage: "Percentage",
    fixed: "Fixed",
}

export const paymentMethods = {
    cash: "cash",
    stripe: "stripe",
    paymob: "paymob",
};

export const orderStatuses = {
    pending: "pending",//default status is pending no payment
    placed: "placed",//payment is cash with delivery
    confirmed: "confirmed",//payment is stripe or paymob and it's done
    cancelled: "cancelled",//order is cancelled
    delivered: "delivered",//order is delivered
    returned:"returned",//order is returned because user reject it 
    dropped:"dropped",//order is dropped because it's expired or order has problem like expired
    refunded:"refunded",//order is refunded and payment has been refunded but with reason like order has problem or expired
    onway:"onway",//order is on way by delivery man
};

export const validGoals = {
    weight_loss: "weight loss",
    muscle_gain: "muscle gain",
    maintenance: "maintenance",
};