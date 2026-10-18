import { prisma } from "../../lib/database.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";

export async function DeleteApi(req,res){

    const {apiid}=req.body;
    const {id}=req.user
    const {projectId}=req.query;

    try {

        if(!apiid || !projectId){
          return  res.status(200).json({message:"No project or api key to delete"})
        }

        const sameproject=await prisma.apiKey.findFirst({
            where:{
                id:apiid,
                projectId:projectId
            },
            include:{
                project:true
            }
        }) 
        if(!sameproject){
            return res.status(200).json({message:"cannot delete as api is from different project"});
        }
        if(sameproject.project.ownerId!==id){
            return res.status(403).json({message:"You are not authorized to delete this API key"});
        }
        await prisma.apiKey.delete({
            where:{
                id:apiid
            }
        });

        return res.status(200).json({message:"Api key deleted"});
        
    } catch (error) {
        ErrorMsg(error)
        return res.status(500).json({message:"Unable to delete API key"});
    }
}
