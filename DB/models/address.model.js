import mongoose from "mongoose";

const { model } = mongoose;

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    streetName: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: Number,
      required: true,
    },
    buildingNumber: {
      type: String,
      required: true,
      trim: true,
    },
    floorNumber: {
      type: Number,
      required: true,
    },
    addressLabel: String,
    notes: String,
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Address = mongoose.models.Address || model("Address", addressSchema);
export default Address;
