import { prisma } from "../../lib/database.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";

export async function GetProject(req,res){

    try {
        const {id}=req.user
        const Project=await prisma.project.findMany({
            where:{
                ownerId:id
            }
        })

        return res.status(200).json({message:"Project fetched",data:Project})
        
    } catch (error) {
        ErrorMsg(error);
        return res.status(500).json({message:"Unable to fetch projects"});
    }
}
