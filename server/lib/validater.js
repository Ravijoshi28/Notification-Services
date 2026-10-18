import crypto from "node:crypto";
import dotenv from "dotenv"
import { ErrorMsg } from "./ErrorMsg.js";
import JWT from "jsonwebtoken";
dotenv.config();

export function hashToken(token){
    return crypto.createHash("sha256").update(token).digest("hex");
}

export function ValidateUser(req,res,next){
  try {
     const token=req.cookies?.accessToken;

  if(!token){
    return res.status(401).json({message:"user is not authorized"});
  }

  const user=JWT.verify(token,process.env.JWT_SECRET);

  if(!user){
     return res.status(401).json({message:"user is not authorized"});
  }

  req.user=user;
  return next();
  } catch (error) {
    ErrorMsg(error)
    return res.status(401).json({message:"user is not authorized"});
  }
}
