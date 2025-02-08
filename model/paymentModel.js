const mongoose = require("mongoose");
const { Schema } = mongoose;

const PaymentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ["Cash on Delivery", "Credit Card", "Debit Card", "UPI", "Net Banking"],
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending",
    },
    amount: { type: Number, required: true },
    transactionId: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", PaymentSchema);
