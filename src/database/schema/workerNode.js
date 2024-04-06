
const workerNodeSchema = new Schema({
    walletAddress: {
        type: String,
        required: [true, "wallet address is needed"]
    },
});

export default model("workerNode", workerNodeSchema);