import { Router } from "express";
import { Signup } from "./signup.js";
import { Login } from "./login.js";
import { Logout } from "./logout.js";
import { Refresh } from "./refresh.js";

const router=Router();

router.post("/auth/v1/signup",Signup)
router.post("/auth/v1/login",Login)
router.delete("/auth/v1/delete",Logout)
router.post("/auth/v1/refresh",Refresh)

export default router