import { Schema, model } from "mongoose";

const userSchema = new Schema({
    userId: {
        type: String,
        required: [true, "user id is needed"]
    },
    status: {
        type: String,
        required: [true, "status is needed"]
    },
});

export default model("ticket", userSchema);