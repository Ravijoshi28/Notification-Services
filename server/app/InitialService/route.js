import { Router } from "express";
import { Authenticator } from "../authenticator/Authenticate.js";
import { ServiceDefiner } from "./initial.js";

const router=Router();

router.put("/v1/service",Authenticator,ServiceDefiner)

export default router