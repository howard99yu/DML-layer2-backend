
import util from "../utils/utils.js";
const workerNode ={
    async sendBashCommand(req,res){
        try{
            const command = req.body.param;
            const result = await util.runBashCommand(command);
            res.status(200).send({result: result});
        }catch(err){
            res.status(500).send({ status: "Internal Server Error"});
        }
    }
}
export default workerNode;