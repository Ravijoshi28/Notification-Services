import { Worker } from "bullmq";
import { EmailService } from "./Service.js";
import { redis } from "../../lib/redis.js";

const worker= new Worker("notification",async(job)=>{
    if(job.name==="send-email"){
        const {id}=job.data;
        if(!id){
        throw new Error(`task id ${id} not found`)
    }
       return await EmailService(id);
    }else{
        throw new Error(`task not found`)
                
    }
    
    

},{connection:redis})

worker.on("completed",(job)=>{
    console.log("job completed");
})

worker.on("failed",(job,err)=>{
    console.log(`job failed ${job}`,err);
})
