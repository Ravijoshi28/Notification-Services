import nodemailer from "nodemailer";
import { prisma } from "../../lib/database.js";
import { encryptPassword } from "../../lib/encryption.js";
import  dotenv from "dotenv";
import { ErrorMsg } from "../../lib/ErrorMsg.js";
import crypto from "node:crypto"

dotenv.config();


export async function SMTPconnection(req,res){

    try{
        const {host,port,password,email,company,user}=req.body
        const {id}=req.user
        const {projectId}=req.query;

        if(!host || !port || !user || !password || !email){
           return res.status(405).json({message:"some of the information is missing"});
        }
        if(!projectId || !Number.isInteger(Number(port)) || Number(port)<1 || Number(port)>65535){
            return res.status(400).json({message:"Project or SMTP port is invalid"});
        }
        const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
           return res.status(405).json({message:"Email format is invalid"});
        }
        const ownership=await prisma.project.findUnique({
            where:{
                id:projectId
            }
        });

        if(!ownership || ownership.ownerId!==id){
            return res.status(401).json({message:"You are not authoried to modify this"})
        }
        const encryptPass= encryptPassword(password);
        const token=crypto.randomUUID()

        const alreadyPresent=await prisma.smtpConfig.findUnique({
            where:{
                projectId:projectId
            }
        })

        

        if(alreadyPresent){
            await prisma.smtpConfig.update({
                where:{
                    projectId
                },
                data:{
                    host,
                    port:Number(port),
                    secure:Number(port)===465,
                    user,
                    encryptedPassword:encryptPass.encryptedPassword,
                    iv:encryptPass.iv,
                    authTag:encryptPass.authTag,
                    email,
                    company,
                    token,
                    emailVerified:false,
                },
            })

            return await sendVerification({host,port:Number(port),secure:Number(port)===465,user,password,email,token,res,status:202});
        }

       

        const Smtp=await prisma.smtpConfig.create({
            data:{
                projectId  :projectId,          
  host          :host,    
  port          :Number(port),    
  secure            :Number(port)===465,
  user            :user  ,
  encryptedPassword :encryptPass.encryptedPassword,
  iv :encryptPass.iv               ,
  authTag  :encryptPass.authTag      ,   
  email   :email,          
  company  :company         ,
  createdAt :new Date(),       
  updatedAt  :new Date(),    
  token:token   ,
  emailVerified:false,
            },
            omit:{
                    iv:true,
                    authTag:true,
                    createdAt:true,
                    updatedAt:true,
                    secure:true,
                    projectId:true,
                    token:true
                }
        })

        return await sendVerification({host,port:Number(port),secure:Number(port)===465,user,password,email,token,res,status:200});

    }catch(error){
        ErrorMsg(error)
        return res.status(500).json({message:"Unable to save SMTP connection"});
    }
}

async function sendVerification({host,port,secure,user,password,email,token,res,status}){
        // Verify through the SMTP account the user just configured. This also
        // supports test inboxes such as Ethereal without global mail settings.
        const transporter=nodemailer.createTransport({
            host,
            port,
            secure,
            auth:{user,pass:password},
        });

        const baseUrl=process.env.APP_URL;
        if(!baseUrl){
            throw new Error("APP_URL is not configured");
        }
        const verifyUrl=`${baseUrl.replace(/\/$/,"")}/appNoti/api/v1/smtp/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

        await transporter.sendMail({
            from:email,
            to:email,
            subject:"Email Verification so SMTP can be Connected",
            text:"Click on the button to verify the Email.--Note This is a one time verification do not share this message. If u didnt verify now u can come any time and verify later .No other verification link will be sended after this .",
            html: `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Verify your email address</h2>
      <p>Click the button below to verify your organisation's email.</p>

      <a
        href="${verifyUrl}"
        style="
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
        "
      >
        Verify Email
      </a>
      </div>`
        })

        return res.status(status).json({message:"Check your email to verify the SMTP connection"});
}
