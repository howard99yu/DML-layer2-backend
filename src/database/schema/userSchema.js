import { Schema, model } from "mongoose";

const userSchema = new Schema({
    walletAddress: {
        type: String,
        required: [true, "wallet address is needed"]
    },
    userId: {
        type: String,
        required: [true, "name is needed"]
    },
    userEmail: {
        type: String,
        required: [true, "status is needed"]
    },
    password: {
        type: String,
        required: [true, "encrypted password is needed"]
    },
});

export default model("user", userSchema);