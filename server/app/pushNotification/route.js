import { Router } from "express";
import { Authenticator } from "../authenticator/Authenticate.js";
import { SaveConsolePushSubscription, SavePushSubscription } from "./subscribe.js";
import { GetPushConfig, SavePushDomain } from "./domain.js";
import { ValidateUser } from "../../lib/validater.js";

const router = Router();

router.post("/push/v1/subscribe", Authenticator, SavePushSubscription);
router.post("/push/v1/console-subscribe", ValidateUser, SaveConsolePushSubscription);
router.get("/push/v1/config", ValidateUser, GetPushConfig);
router.post("/push/v1/domain", ValidateUser, SavePushDomain);

export default router;
