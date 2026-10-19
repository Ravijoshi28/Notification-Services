import webpush from "web-push";
import { prisma } from "../../lib/database.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";

export async function PushService(notificationId, lastAttempt = false) {
  try {
    const notification = await prisma.pushNotification.findUnique({
      where: { id: notificationId },
      include: { project: { select: { domain: true } } },
    });

    if (!notification) throw new Error("Push notification was not found");

    await prisma.pushNotification.update({
      where: { id: notification.id },
      data: { status: "sending", attempts: { increment: 1 }, error: null },
    });

    if (!notification.project.domain) throw new Error("Set a project domain before sending push notifications");

    const publicKey = process.env.VAPID_PUBLIC;
    const privateKey = process.env.VAPID_SECRETKEY;
    if (!publicKey || !privateKey) throw new Error("VAPID_PUBLIC and VAPID_SECRETKEY must be set");
    const subject = process.env.VAPID_SUBJECT || (notification.project.domain.startsWith("https://") ? notification.project.domain : "");
    if (!subject) throw new Error("Set VAPID_SUBJECT to a mailto contact when testing on localhost");

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { projectId: notification.projectId, userId: notification.userId },
    });

    if (subscriptions.length === 0) {
      await prisma.pushNotification.update({
        where: { id: notification.id },
        data: { status: "failed", error: "No subscriptions found for this user" },
      });
      return { status: "failed", message: "No subscriptions found for this user" };
    }

    const payload = JSON.stringify({
      title: notification.header,
      body: notification.body,
      data: { userId: notification.userId, organization: notification.organization },
    });
    const vapidDetails = {
      subject,
      publicKey,
      privateKey,
    };

    const results = await Promise.allSettled(subscriptions.map(subscription => webpush.sendNotification({
      endpoint: subscription.endpoint,
      expirationTime: subscription.expiresAt?.getTime() || null,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    }, payload, { TTL: 60 * 60, vapidDetails })));

    const delivered = results.filter(result => result.status === "fulfilled").length;
    const failed = results.filter(result => result.status === "rejected");
    const expiredEndpoints = failed
      .filter(result => result.reason?.statusCode === 404 || result.reason?.statusCode === 410)
      .map(result => subscriptions[results.indexOf(result)].endpoint);

    if (expiredEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: expiredEndpoints } } });
    }

    const transientFailures = failed.filter(result => {
      const statusCode = result.reason?.statusCode;
      return statusCode === undefined || statusCode === 429 || statusCode >= 500;
    });

    if (delivered === 0 && transientFailures.length > 0) {
      await prisma.pushNotification.update({
        where: { id: notification.id },
        data: { status: "retry", error: String(transientFailures[0].reason?.message || "Push delivery failed").slice(0, 1000) },
      });
      throw transientFailures[0].reason;
    }

    const errorMessage = failed.length > 0 ? `${failed.length} subscription(s) could not be reached` : null;
    await prisma.pushNotification.update({
      where: { id: notification.id },
      data: {
        status: delivered > 0 ? "sent" : "failed",
        sentAt: delivered > 0 ? new Date() : null,
        error: errorMessage,
      },
    });

    return { status: delivered > 0 ? "sent" : "failed", delivered, failed: failed.length };
  } catch (error) {
    await prisma.pushNotification.updateMany({
      where: { id: notificationId },
      data: {
        status: lastAttempt ? "failed" : "retry",
        error: String(error?.message || "Push delivery failed").slice(0, 1000),
      },
    }).catch(() => {});
    ErrorMsg(error);
    throw error;
  }
}
