
import user from "../schema/userSchema.js";


export default{
    async createTicket(body){
        const exist = await user.findOne({ usrId: body.userId});
        if(exist){
            throw new ExistedException("wallet already exist");
        }
        const ticket = await user.create(body);
        return ticket;
    },
    async updateTicket(body){
        const ticket = await user.findOne({ usrId: body.userId});
        if (ticket){
            ticket.status = body.status;
            ticket.save(); 
        }
        return ticket;
    },
    async getTicket(body){ 
        const ticket = await user.findOne({ usrId: body.userId});
        console.log(ticket);
        if (ticket){
            return ticket;
        }
    }

}