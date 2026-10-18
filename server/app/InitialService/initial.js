import { ErrorMsg } from "../../lib/ErrorMsg.js";
import {QueueEmails } from "../emailService/Pushemail.js"
export async function ServiceDefiner(req,res){

    try{

        const channel=req.body.channel;

        switch(channel){
          case "email":
           const emailReq=await QueueEmails(req.projectId,req.body.data);
           return res.status(202).json(emailReq);

          case "sms":
            //not available yet
            return res.status(501).json({message:"SMS is not available yet"})
            
          default:
            return res.status(200).json({message:"Channel is not defined"})  ;

        }

    }catch(error){
        ErrorMsg(error);
        return res.status(500).json({message:"Unable to process request"});
    }
}
