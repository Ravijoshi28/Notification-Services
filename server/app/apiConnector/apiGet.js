import { prisma } from "../../lib/database.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";

export async function GetApi(req,res){

    try{
        const {projectId}=req.query;
        const {id}=req.user;

        if(!projectId){
           return res.status(200).json({message:"No project found",data:[]})
        }
        const project=await prisma.project.findUnique({where:{id:projectId}});
        if(!project || project.ownerId!==id){
            return res.status(403).json({message:"You cannot view API keys for this project"});
        }
        const apiKeys=await prisma.apiKey.findMany({
            where:{
                projectId
            },
            select:{
                id:true,
                lastFour:true,
                name:true,
            }
        })

        return res.status(200).json({message:"Apikeys for project returned",data:apiKeys})

    }catch(error){
        ErrorMsg(error);
        return res.status(500).json({message:"Unable to fetch API keys"});
    }
}
