import { ValidateUser } from "../../lib/validater.js";
import { Router } from "express";
import { SMTPconnection } from "./smtp.js";
import { VerifyConnection } from "./verify.js";
import { DeleteSMTP } from "./smtpDelete.js";

const router=Router();

router.post("/v1/smtp/SMTPconnection",ValidateUser,SMTPconnection)
router.get("/v1/smtp/verify-email",VerifyConnection)
router.post("/v1/smtp/delete-connection",ValidateUser,DeleteSMTP)

export default router
