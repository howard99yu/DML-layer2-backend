import express from "express";
import workerNodeRouter from "./src/routes/routes.js";

const app = express();

app.use(express.json());

app.use("/api", workerNodeRouter);

const port = 3000;

app.listen(port, () => {
console.log(`Server listening on port ${port}`)
});