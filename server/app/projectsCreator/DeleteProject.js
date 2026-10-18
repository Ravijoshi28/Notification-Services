import { prisma } from "../../lib/database.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";

export async function DeleteProject(req,res){

    try{
        const {id}=req.user;
        const {projectId}=req.query;
       const project= await prisma.project.findUnique({
            where:{
                id:projectId,
            }
        })

        if(!project){
            return res.status(404).json({message:"No project found"});
        }
        if(project.ownerId!==id){
            return res.status(401).json({message:"You cannot make changes"})
        }
        await prisma.project.delete({
            where:{
                id:projectId
            }
        })
        return res.status(200).json({message:"Project deleted"})

    }catch(error){
        ErrorMsg(error)
        return res.status(500).json({message:"Unable to delete project"});
    }
}
