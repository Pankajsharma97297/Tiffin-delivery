const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    customer: String,
    channel: String,
    issue: String,
    priority: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
