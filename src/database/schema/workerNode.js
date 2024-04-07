import { Schema, model } from "mongoose";

const workerNodeSchema = new Schema({
    walletAddress: {
        type: String,
        required: [true, "wallet address is needed"]
    },
    username: {
        type: String,
        required: [true, "worker node name is needed"]
    },
});

export default model("workerNode", workerNodeSchema);