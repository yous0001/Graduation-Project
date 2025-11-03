import mongoose, { model } from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
    },
    Images: [
      {
        public_id: { type: String },
        secure_url: { type: String },
      },
    ],
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Banner = mongoose.models.Banner || model("Banner", bannerSchema);
export default Banner;
