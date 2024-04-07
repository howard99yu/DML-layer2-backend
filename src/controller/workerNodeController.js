
import util from "../utils/utils.js";
import workerNodeCurd from "../database/crud/workerNodeCurd.js";
const workerNode ={
    async sendBashCommand(req,res){
        try{
            const command = req.body.param;
            const result = await util.runBashCommand(command);
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
}
export default workerNode;