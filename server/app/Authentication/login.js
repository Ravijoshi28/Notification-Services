import { prisma } from "../../lib/database.js";
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import { ErrorMsg } from "../../lib/ErrorMsg.js";
import { AccessToken,RefreshToken } from "../../lib/CookieGenerator.js";
import { hashToken } from "../../lib/validater.js";
dotenv.config();

const pepper=process.env.PEPPER;

export async function Login(req,res){

    try {
        const {email,password}=req.body;

        if(!email || !password ){
            return res.status(400).json({message:"User detail are missing"})
        }
        if(password.length<8){
             return res.status(400).json({message:"User password is too short"})
        }
            const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(!emailRegex.test(email)){
             return res.status(400).json({message:"email does not exist"})
        }

        
       const pepperedPass=password+pepper;
       

        const user=await prisma.user.findUnique({
            where:{
                email
            }
        })
        if(!user){
            return res.status(401).json({message:"Email or password wrong"});
        }

        const comparedPass=await bcrypt.compare(pepperedPass,user.passwordHash);

        if(!comparedPass){
            return res.status(401).json({message:"Email or password wrong"});
        }
        const userinfo={id:user.id,
            email:user.email,
            username:user.name
        }

        const refreshToken=await RefreshToken(userinfo)
        const accessToken=await AccessToken(userinfo);

        res.cookie("accessToken",accessToken,{
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            path:"/",
            sameSite:"strict",
            maxAge:30*60*1000
        })
        const expiryAt=new Date(Date.now()+7*24*60*60*1000);
                await prisma.session.create({
                    data:{
                        userId:user.id,
                        tokenHash:hashToken(refreshToken),
                        createdAt:new Date(),
                        expiresAt:expiryAt
                    }
                })

        res.cookie("refreshToken",refreshToken,{
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            path:"/",
            sameSite:"strict",
            maxAge:7*24*60*60*1000
        })

        return res.status(200).json({message:"user logged in",data:userinfo});

    } catch (error) {
        ErrorMsg(error)
        return res.status(500).json({message:"Unable to log in"})
    }

}
