import express from "express";
import workerNodeController from "../controller/workerNodeController.js";


const userRouter = express.Router();

userRouter.post("/sendBashCommand", workerNodeController.sendBashCommand);

export default userRouter;