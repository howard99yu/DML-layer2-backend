
import userCurd from "../schema/userSchema.js";
import ExistedException from "../../exceptions/existedException.js";
import NotFoundException from "../../exceptions/notFoundException.js";


export default{
    async createUser(body){
        const user = await userCurd.create(body);
        console.log("user", user);
        return user;
    },
    async getUser(body){ 
        const ticket = await userCurd.findOne({ userId: body.userId, password: body.password});
        if (ticket){
            return ticket;
        }
    },

}