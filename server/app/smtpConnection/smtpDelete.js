import { prisma } from "../../lib/database.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";

export async function DeleteSMTP(req,res){

    try {
        const {projectId}=req.query;
        const {id}=req.user;

        if(!projectId){
            return res.status(400).json({message:"No project id given"})
        }

        const project=await prisma.project.findUnique({where:{id:projectId}});
        if(!project || project.ownerId!==id){
            return res.status(400).json({message:"Cannot delete SMTP config either project wrong or you are not the owner"})
        }
        await prisma.smtpConfig.delete({where:{projectId}});
        return res.status(200).json({message:"SMTP config deleted"});

    } catch (error) {
        ErrorMsg(error);
        return res.status(500).json({message:"Unable to delete SMTP config"});
    }
}
