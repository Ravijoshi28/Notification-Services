
import { prisma } from "../../lib/database.js";
import { hashToken } from "../../lib/validater.js";
import { AccessToken } from "../../lib/CookieGenerator.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";

export async function Refresh(req,res){

    try {
         const token=req.cookies.refreshToken;
    if(!token){
        return res.status(401).json({message:"Refresh token is missing"});
    }
    const refreshed=await prisma.session.findFirst({
        where:{
            tokenHash:hashToken(token)
        }
    })

    if(!refreshed || refreshed.expiresAt<new Date()){
          return res.status(401).json({message:"Refresh token is invalid or expired"});
    }
    const user=await prisma.user.findUnique({
        where:{
            id:refreshed.userId
        },
        select:{
            id:true,
            email:true,
            name:true
        }
    });

    if(!user){
        return res.status(401).json({message:"User no longer exists"});
    }
    const accessToken=await AccessToken({...user,username:user.name});

    res.cookie("accessToken",accessToken,{
         httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            path:"/",
            sameSite:"strict",
            maxAge:30*60*1000
    })

    return res.status(200).json({message:"token generated",data:user})

    } catch (error) {
        ErrorMsg(error);
        return res.status(500).json({message:"Unable to refresh token"});
    }
   

}
