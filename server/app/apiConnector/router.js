import { Router } from "express";
import { GetApi } from "./apiGet.js";
import { Generator } from "./APIgenerator.js";
import { DeleteApi } from "./apiDelete.js";
import { ValidateUser } from "../../lib/validater.js";

const router=Router();

router.get("/api-route/v1/project",ValidateUser,GetApi)
router.post("/api-route/v1/create-api",ValidateUser,Generator)
router.delete("/api-route/v1/delete-api",ValidateUser,DeleteApi)

export default router