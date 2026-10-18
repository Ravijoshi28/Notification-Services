import {Queue} from "bullmq";
import { redis } from "../../lib/redis.js";

export const NotificationQueue=new Queue("notification",{connection:redis})
