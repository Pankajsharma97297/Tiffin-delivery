const mongoose = require("mongoose");

const homeChefChangeRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    customerName: { type: String, default: "MIDDO Customer" },
    customerPhone: String,
    currentChefId: { type: mongoose.Schema.Types.ObjectId, ref: "HomeChef" },
    currentChefName: String,
    requestedChefId: { type: mongoose.Schema.Types.ObjectId, ref: "HomeChef" },
    requestedChefName: String,
    reason: { type: String, required: true },
    note: String,
    status: {
      type: String,
      enum: ["Pending Admin Approval", "Approved", "Rejected", "Assigned"],
      default: "Pending Admin Approval",
    },
    assignedChefId: { type: mongoose.Schema.Types.ObjectId, ref: "HomeChef" },
    assignedChefName: String,
    adminNote: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "HomeChefChangeRequest",
  homeChefChangeRequestSchema,
);
