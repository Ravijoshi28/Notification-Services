import { prisma } from "../../lib/database.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";
import crypto from "node:crypto";

export async function VerifyConnection(req,res){

    const {email,token}=req.query;

    try{

        if(!email ||!token ){
            return res.status(400).json({message:"Varification failed"});
        }

       const config=await prisma.smtpConfig.findFirst({where:{email,token}});

        if(!config){
            return res.status(401).json({message:"Verification failed"})
        }
        await prisma.smtpConfig.update({
            where:{projectId:config.projectId},
            data:{emailVerified:true,token:crypto.randomUUID()}
        });
        return res.status(200).json({message:"Verification Completed"}) 

    }catch(error){
        ErrorMsg(error)
        return res.status(500).json({message:"Unable to verify email"});
    }
}
