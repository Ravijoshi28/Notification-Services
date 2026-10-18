import { prisma } from "../../lib/database.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";

export async function CreateProject(req,res){

    try {
        const {name}=req.body;
        const {id}=req.user;
        if(!name){
            return res.status(400).json({message:"Project name is required"});
        }
        if(!id){
            return res.status(401).json({message:"user is not authorized"});
        }
        const userProjects=await prisma.project.findMany({
            where:{
                ownerId:id,
            }
        })

        if(userProjects.length>=2){
            return res.status(403).json({message:"free user can only create 2 project"});
        }

        const project=await prisma.project.create({
            data:{
                ownerId:id,
                name:name,
                createdAt:new Date(),
                updatedAt:new Date()
            }
        })

        return res.status(201).json({message:"project is created",data:project});


    } catch (error) {
        ErrorMsg(error);
        return res.status(500).json({message:"Unable to create project"});
    }
}
