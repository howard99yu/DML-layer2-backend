import { Schema, model } from "mongoose";

const userSchema = new Schema({

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
    userType: {
        type: String,
        required: [true, "usertype is needed"]
    },
});

export default model("user", userSchema);