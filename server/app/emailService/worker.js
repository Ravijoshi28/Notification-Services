import { Worker } from "bullmq";
import { EmailService } from "./Service.js";
import { PushService } from "../pushNotificationService.js/service.js";
import { redis } from "../../lib/redis.js";

const worker = new Worker("notification", async job => {
  const { id } = job.data;
  if (!id) throw new Error("Task id is missing");

  switch (job.name) {
    case "send-email":
      return EmailService(id);
    case "push-notification":
      return PushService(id, job.attemptsMade + 1 >= (job.opts.attempts || 1));
    default:
      throw new Error(`Task ${job.name} is not supported`);
  }
}, { connection: redis });

worker.on("ready", () => {
  console.log("Notification worker is ready");
});

worker.on("completed", job => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed`, error);
});
