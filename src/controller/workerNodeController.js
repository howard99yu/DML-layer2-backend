
import util from "../utils/utils.js";
import workerNodeCurd from "../database/crud/workerNodeCurd.js";
import ticketCrud from "../database/crud/ticketCrud.js";
import fs from "fs";
import path from "path";

const filepath = "/mnt/c/Users/howar/Downloads/MINST/cw.txt";
const workerNode ={
    async sendBashCommand(req,res){
        try{
            const command = req.body.param;
            const result =  await util.runBashCommand(command);
            // while (true){
            //     if (fs.existsSync(filepath)){
            //         break;
            //     }
            // }
            res.status(200).send({result: result});
        }catch(err){
            res.status(500).send({ status: "Internal Server Error"});
        }
    },
    async createNodeProvider(req, res){
        try{
            const wallet = await workerNodeCurd.createWallet(req.body);
            res.status(200).send({result: wallet});
        }
        catch(error){
            res.status(500).send({ status: error});
        }
    },
    async createTicket(req, res){
        try{
            const ticket = await ticketCrud.createTicket(req.body);
            res.status(200).send({result: ticket});
        }
        catch(error){
            res.status(500).send({ status: error});
        }
    },
    async getTickets(req, res){
        try{
            const tickets = await ticketCrud.getTicket(req.params);
            res.status(200).send({result: tickets});
        }
        catch(error){
            res.status(500).send({ status: error});
        }
    },
    async getWorkerNode(req, res){
        try{
            const wallet = await workerNodeCurd.getUserWallet(req.params.userId);
            res.status(200).send({result: wallet});
        }
        catch(error){
            res.status(500).send({ status: error});
        }
    }
}
export default workerNode;