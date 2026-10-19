import { prisma } from "../../lib/database.js";
import { randomUUID } from "node:crypto";
import { NotificationQueue } from "../queueSystem/emailqueue.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";

export async function PushQueue(projectId, data) {
  try {
    if (!projectId || !data?.id || !data?.userId || !data?.header || !data?.organization || !data?.body) {
      throw new Error("Project and complete push notification details are required");
    }

    const pushRequest = await prisma.pushNotification.create({
      data: {
        projectId,
        userId: data.userId,
        requestId: data.id,
        header: data.header,
        body: data.body,
        organization: data.organization,
        payload: data.payload || {},
        idempotencyKey: randomUUID(),
      },
    });

    await NotificationQueue.add("push-notification", { id: pushRequest.id }, {
      attempts: 4,
      backoff: { type: "exponential", delay: 10000 },
    });

    return { id: pushRequest.id, status: "queued" };
  } catch (error) {
    ErrorMsg(error);
    throw error;
  }
}
