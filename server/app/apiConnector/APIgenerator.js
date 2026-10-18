import { Hash_api } from "../../lib/api_hash.js";
import { prisma } from "../../lib/database.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";
import crypto from "node:crypto"

export async function Generator(req,res){

    try {
        const {name}=req.body
        const {id}=req.user;
        const {projectId}=req.query
        if(!id){
            return res.status(401).json({message:"cannot authorized user"});
        }

        const project=await prisma.project.findUnique({where:{id:projectId}});
        if(!project || project.ownerId!==id){
            return res.status(401).json({message:"You cannot change or generate the api key"})
        }

        const APIKey=await prisma.apiKey.findMany({where:{projectId}})

        if(APIKey.length>=2){
            return res.status(200).json({message:"Already assigned max api keys"})
        }

        const key=`ns_live_${crypto.randomBytes(32).toString("hex")}`;
        

        const apikey=await prisma.apiKey.create({
            data:{
                name      :name,
                keyHash   :await Hash_api(key) ,
                lastFour  :key.slice(-4),
                projectId :projectId,
                createdAt :new Date(),
            },
            select:{
                id:true,
              name:true,
              lastFour:true, 
            }
        })

        return res.status(201).json({message:"Api key created",data:{...apikey,key}});
        
    } catch (error) {
        ErrorMsg(error);
        return res.status(500).json({message:"Unable to create API key"});
    }

}
