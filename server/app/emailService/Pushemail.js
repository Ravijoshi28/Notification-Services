import { prisma } from "../../lib/database.js";
import { randomUUID } from "node:crypto";
import { NotificationQueue } from "../queueSystem/emailqueue.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";

export async function QueueEmails(Id,data){
    // right now the ideomkey is created in my service but in actual the idempotency key will be provided by client 
    //and before storing data in db we will check if the data already exist ie the ideom key already exist 

    try{
        if(!Id || !data?.id || !data?.recipientEmail || !data?.subject || !data?.body){
            throw new Error("Project and complete email details are required");
        }
        const ideomkey=randomUUID();
        const emailReq=await prisma.email.create({
            data:{
                status:"queued",
                projectId:Id,
  event          :"email",
  recipientEmail :data.recipientEmail,
  subject        :data.subject,
  body           :data.body,
  payload        :{
    metaData:"pending in queue"
  },
  attempts      : 0,
  idempotencyKey:ideomkey,
  createdAt      :new Date(),
  updatedAt      :new Date()  ,
  requestId:data.id
          }
        })

        const {id}=emailReq

        await NotificationQueue.add("send-email",
            {id},
            {
                attempts:4,
                backoff:{
                    type:"exponential",
                    delay:10000
                },
            }
        )
        return { id, status:"queued" };

    }catch(error){
        ErrorMsg(error)
        throw error;
    }

}
