import { prisma } from "../../lib/database.js";
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import { ErrorMsg } from "../../lib/ErrorMsg.js";
import { hashToken } from "../../lib/validater.js";
import { AccessToken,RefreshToken } from "../../lib/CookieGenerator.js";
dotenv.config();

const pepper=process.env.PEPPER;
const SALT=8

export async function Signup(req,res){

    try {
        const {username,email,password}=req.body;

        if(!username || !email || !password ){
            return res.status(400).json({message:"User detail are missing"})
        }
        if(password.length<8){
             return res.status(400).json({message:"User password is too short"})
        }
            const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(!emailRegex.test(email)){
             return res.status(400).json({message:"email does not exist"})
        }

        const alreadyuser=await prisma.user.findUnique({
            where:{
                email
            }
        })

        if(alreadyuser){
            return res.status(200).json({message:"User already exist"});
        }
       const pepperedPass=password+pepper;
       const hashpass=await bcrypt.hash(pepperedPass,SALT)

        const user=await prisma.user.create({
            data:{
                email:email,
                name:username,
                createdAt:new Date(),
                updatedAt:new Date(),
                passwordHash:hashpass
            },
            select:{
                id:true,
                email:true,
                name:true
            }
        })

        const refreshToken=await RefreshToken({...user, username:user.name})
        const accessToken=await AccessToken({...user, username:user.name});
        const expiryAt=new Date(Date.now()+7*24*60*60*1000);
        await prisma.session.create({
            data:{
                userId:user.id,
                tokenHash:hashToken(refreshToken),
                createdAt:new Date(),
                expiresAt:expiryAt
            }
        })

        res.cookie("accessToken",accessToken,{
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            path:"/",
            sameSite:"strict",
            maxAge:30*60*1000
        })
        res.cookie("refreshToken",refreshToken,{
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            path:"/",
            sameSite:"strict",
            maxAge:7*24*60*60*1000
        })

        return res.status(201).json({message:"user created",data:user});

    } catch (error) {
        ErrorMsg(error)
        return res.status(500).json({message:"Unable to create user"})
    }

}
