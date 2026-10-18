import {ErrorMsg} from "../../lib/ErrorMsg.js"
import {prisma} from "../../lib/database.js" 
import { Hash_api } from "../../lib/api_hash.js";

export async function Authenticator(req,res,next){

    try{

        const authHeader=req.headers.authorization;

        if(!authHeader){
            return res.status(401).json({message:"API key is missing "})
        }

        const [scheme,api_key]=authHeader.split(" ");
        if(scheme!=="Bearer" || !api_key){
            return res.status(401).json({message:"API key is missing "})
        }
        const hashed=await Hash_api(api_key)

        const validateId=await prisma.apiKey.findFirst({
            where:{keyHash:hashed,revokedAt:null}
        })

        if(!validateId){
            return res.status(401).json({message:"Api key is invalid either write the correct key or create new"})
        }

        req.projectId=validateId.projectId;

        return next();
    }
    catch(error){
        ErrorMsg(error);
        return res.status(500).json({message:"Authentication failed"});
    }
}
