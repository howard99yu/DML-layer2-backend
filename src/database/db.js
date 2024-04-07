import dotenv from 'dotenv';
import mongoose from "mongoose";

dotenv.config();

export default {
    connect() {
        const prefix = "mongodb://";
        const auth = `${process.env.MONGO_ROOT_USERNAME}:${process.env.MONGO_ROOT_PASSWORD}@`;
        const baseUrl = `${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DBNAME}?authSource=admin`;
        //const mongdbUri = process.env.MONGO_ROOT_USERNAME == null ? prefix + baseUrl : prefix + auth + baseUrl;
        // const mongdbUri = `mongodb+srv://howardyu:${process.env.PASSWORD}@test1.s3akqes.mongodb.net/?retryWrites=true&w=majority`;
        const mongdbUri =`mongodb+srv://howard9:${process.env.PASSWORD}@dmldatabase.vordk9h.mongodb.net/?retryWrites=true&w=majority&appName=DMLdataBase`
        mongoose.set("strictQuery", false);
        mongoose.connect(mongdbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
            .then(() => console.log("DB Connected successfully"))
            .catch(err => {
                console.error("Connection error:", err);
                process.exit(1);
            });
    },
    disconnect() {
        mongoose.disconnect();
    }
}
