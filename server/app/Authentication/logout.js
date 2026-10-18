import { prisma } from "../../lib/database.js"
import { hashToken } from "../../lib/validater.js"

export async function Logout(req,res){

    try {
    const token=req.cookies?.refreshToken;
    if(token){
        await prisma.session.deleteMany({where:{tokenHash:hashToken(token)}})
    }

    res.clearCookie("accessToken",{
         httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            path:"/",
            sameSite:"strict",
            maxAge:30*60*1000
    })

    res.clearCookie("refreshToken",{
         httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            path:"/",
            sameSite:"strict",
            maxAge:7*24*60*60*1000
    })
    return res.status(200).json({message:"Logged out"});
    } catch(error) {
        return res.status(500).json({message:"Unable to log out"});
    }
}
