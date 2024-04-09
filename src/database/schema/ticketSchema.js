import { Schema, model } from "mongoose";

const ticketSchema = new Schema({
    userId: {
        type: String,
        required: [true, "user id is needed"]
    },
    walletAddress: {
        type: String,
        required: [true, "wallet address is needed"]
    },
    amount: {
        type: Number,
        required: [true, "amount is needed"]
    },
    uploadStatus: {
        type: String,
        required: [true, "status is needed"]
    },
    transactionHash: {
        type: String,
        required: [true, "transaction hash is needed"]
    },
});

export default model("ticket", ticketSchema);