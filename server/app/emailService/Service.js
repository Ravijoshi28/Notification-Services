import { prisma } from "../../lib/database.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";
import { decryptPassword } from "../../lib/encryption.js";
import nodemailer from "nodemailer";

export async function EmailService(requestId){

    let emailFound=false;
    let attempts=0;
    try{
        const Email=await prisma.email.findUnique({
            where:{
                id:requestId
            }
        })
        if(!Email){
            throw new Error("Email not found")
        }
        if(!Email.projectId){
            throw new Error("Email project is missing");
        }
        emailFound=true;
        attempts=Email.attempts+1;
        if(Email.status==="sent"){
            return Email;
        }

        await prisma.email.update({
            where:{id:requestId},
            data:{
                status:"sending",
                attempts:{increment:1},
                lastAttemptAt:new Date(),
            }
        })

       const delivery=await Mailer(requestId);

       await prisma.email.update({
        where:{id:requestId},
        data:{
            status:"sent",
            sentAt:new Date(),
            messageId:delivery.messageId,
        }
       })


    }catch(error){
        ErrorMsg(error);
        if(emailFound){
            await prisma.email.update({
                where:{id:requestId},
                data:{
                    status:attempts>=4 ? "failed" : "retry",
                    lastAttemptAt:new Date(),
                    error:error.message,
                }
            })
        }
        throw error;
    }

} 

async function Mailer(requestId){

   const details= await prisma.email.findUnique({where:{
        id:requestId
                                          },
        include:{
            project:{
                include:{
                    smtp:true
                }
            }
        }
                                    })



    if(!details?.project?.smtp || !details.project.smtp.emailVerified){
        throw new Error("Project has no verified SMTP connection");
    }

    const transporter=nodemailer.createTransport({
        host:details.project.smtp.host,
        port:details.project.smtp.port,
        secure:details.project.smtp.secure,
        auth:{
            user:details.project.smtp.user,
            pass:decryptPassword(details.project.smtp),
        },
    })

    return transporter.sendMail({
        from:{
            name:details.project.smtp.company,
            address:details.project.smtp.email,
        },
        to:details.recipientEmail,
        envelope:{
            from:details.project.smtp.email,
            to:[details.recipientEmail],
        },
        subject:details.subject,
        text:details.body
    })
}
