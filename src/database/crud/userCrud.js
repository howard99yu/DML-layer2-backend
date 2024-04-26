
import user from "../schema/userSchema.js";
import ExistedException from "../../exceptions/existedException.js";
import NotFoundException from "../../exceptions/notFoundException.js";


export default{
    async createUser(body){
        const user = await user.create(body);
        return ticket;
    },
    async getUser(body){ 
        const ticket = await user.findOne({ userId: body.userId});
        if (ticket){
            return ticket;
        }
    },

}