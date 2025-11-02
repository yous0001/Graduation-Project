import { describe, it, expect } from "bun:test";
import { calculateShippingFee, applyCouponDiscount, checkCouponDiscount } from "./order.services.js";
import orderConfig from "./options/order.config.js";

describe("calculateShippingFee", () => {
  it("returns 0 for non-positive itemCount", () => {
    expect(calculateShippingFee(0)).toBe(0);
    expect(calculateShippingFee(-3)).toBe(0);
  });

  it("returns base fee for 1 item", () => {
    const expected = Math.round(orderConfig.shipping.baseFee);
    expect(calculateShippingFee(1)).toBe(expected);
  });

  it("applies additional fee and discount for multiple items", () => {
    const additionalItems = 2; // itemCount = 3
    const baseFee = orderConfig.shipping.baseFee;
    const additionalItemFee = orderConfig.shipping.additionalItemFee;
    const discountPerItem = orderConfig.shipping.discountPerItem;
    const maxDiscount = orderConfig.shipping.maxDiscount;

    let additionalFee = additionalItemFee * additionalItems;
    const discount = Math.min(discountPerItem * additionalItems, maxDiscount * additionalFee);
    additionalFee -= discount;
    const expected = Math.round(baseFee + additionalFee);
    expect(calculateShippingFee(3)).toBe(expected);
  });
});

describe("checkCouponDiscount validations", () => {
  it("throws when userId is missing", async () => {
    await expect(checkCouponDiscount("TEST10", null, 100)).rejects.toThrowError({
      message: "User ID is required",
      statusCode: orderConfig.errorCodes.invalidRequest,
    });
  });

  it("throws when total is invalid (negative)", async () => {
    await expect(checkCouponDiscount("TEST10", "user123", -5)).rejects.toThrowError({
      message: "Invalid order total",
      statusCode: orderConfig.errorCodes.invalidRequest,
    });
  });
});

describe("applyCouponDiscount error handling", () => {
  it("propagates validation error when userId is missing", async () => {
    await expect(applyCouponDiscount("TEST10", null, 100)).rejects.toMatchObject({
      statusCode: orderConfig.errorCodes.invalidRequest,
    });
  });
});