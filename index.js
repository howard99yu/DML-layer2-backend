import express from "express";
import workerNodeRouter from "./src/routes/routes.js";
import db from "./src/database/db.js";
import cors from "cors";
import stream from "./src/database/changeStream.js";

const app = express();
app.use(cors({
    origin: 'http://localhost:9080', // Replace with your allowed origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
app.use(express.json());

app.use("/api", workerNodeRouter);
app.use(cors());

const port = 3000;


db.connect();
stream.startChangeStream();


app.listen(port, () => {
console.log(`Server listening on port ${port}`)
});