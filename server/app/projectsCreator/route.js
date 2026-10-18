import { ValidateUser } from "../../lib/validater.js";
import { Router } from "express";
import { CreateProject } from "./createProject.js";
import { DeleteProject } from "./DeleteProject.js";
import { GetProject } from "./getProject.js";
const router=Router();

router.post("/project/v1/create",ValidateUser,CreateProject)
router.delete("/project/v1/delete",ValidateUser,DeleteProject)
router.get("/project/v1/getProject",ValidateUser,GetProject)

export default router