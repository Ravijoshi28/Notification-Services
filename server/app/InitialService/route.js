import { Router } from "express";
import { Authenticator } from "../authenticator/Authenticate.js";
import { ServiceDefiner } from "./initial.js";
import { GetServiceStatus } from "./status.js";

const router=Router();

router.put("/v1/service",Authenticator,ServiceDefiner)
router.get("/v1/service/:channel/:id", Authenticator, GetServiceStatus)

export default router
