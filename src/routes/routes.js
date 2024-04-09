import express from "express";
import workerNodeController from "../controller/workerNodeController.js";


const userRouter = express.Router();

userRouter.post("/sendBashCommand", workerNodeController.sendBashCommand);
userRouter.post("/createNodeProvider", workerNodeController.createNodeProvider);
userRouter.post("/createTicket", workerNodeController.createTicket);
userRouter.get("/getWorkerNode/:userId", workerNodeController.getWorkerNode);
// userRouter.post("/createPyamentTicket", workerNodeController.createPyamentTicket);
userRouter.get("/getTicket", workerNodeController.getTickets);

export default userRouter;