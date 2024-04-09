import { Schema, model } from "mongoose";

const workerNodeSchema = new Schema({
    walletAddress: {
        type: String,
        required: [true, "wallet address is needed"]
    },
    userId: {
        type: String,
        required: [true, "worker node name is needed"]
    },
    status: {
        type: String,
        required: [true, "status is needed"]
    },
});

export default model("workerNode", workerNodeSchema);