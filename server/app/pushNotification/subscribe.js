import { prisma } from "../../lib/database.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";

export async function SavePushSubscription(req, res) {
  try {
    const { userId, subscription, domain } = req.body;
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;

    if (!userId || typeof userId !== "string" || typeof endpoint !== "string" || typeof p256dh !== "string" || typeof auth !== "string") {
      return res.status(400).json({ message: "userId and a valid push subscription are required" });
    }

    let endpointUrl;
    let appOrigin;
    try {
      endpointUrl = new URL(endpoint);
      appOrigin = new URL(domain);
    } catch {
      return res.status(400).json({ message: "Push subscription endpoint or app domain is invalid" });
    }
    if (endpointUrl.protocol !== "https:") {
      return res.status(400).json({ message: "Push subscription endpoint must use HTTPS" });
    }
    const isLocalDomain = appOrigin.hostname === "localhost" || appOrigin.hostname === "127.0.0.1";
    if (appOrigin.protocol !== "https:" && !(isLocalDomain && appOrigin.protocol === "http:")) {
      return res.status(400).json({ message: "App domain must use HTTPS" });
    }

    const project = await prisma.project.findUnique({ where: { id: req.projectId }, select: { domain: true } });
    if (!project?.domain || project.domain !== appOrigin.origin) {
      return res.status(403).json({ message: "The app domain does not match the domain saved for this project" });
    }

    const expirationTime = subscription.expirationTime;
    const expiresAt = Number.isFinite(expirationTime) ? new Date(expirationTime) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return res.status(400).json({ message: "Push subscription expiration is invalid" });
    }

    const saved = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { projectId: req.projectId, userId, p256dh, auth, expiresAt },
      create: { projectId: req.projectId, userId, endpoint, p256dh, auth, expiresAt },
      select: { id: true, projectId: true, userId: true, createdAt: true },
    });

    return res.status(201).json({ message: "Push subscription saved", data: saved });
  } catch (error) {
    ErrorMsg(error);
    return res.status(500).json({ message: "Unable to save push subscription" });
  }
}

export async function SaveConsolePushSubscription(req, res) {
  try {
    const { projectId, userId, subscription, domain } = req.body;
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;
    if (!projectId || !userId || typeof userId !== "string" || typeof endpoint !== "string" || typeof p256dh !== "string" || typeof auth !== "string") {
      return res.status(400).json({ message: "Project, user ID, and a valid browser subscription are required" });
    }

    let endpointUrl;
    let appOrigin;
    try { endpointUrl = new URL(endpoint); appOrigin = new URL(domain); }
    catch { return res.status(400).json({ message: "Push subscription endpoint or app domain is invalid" }); }
    if (endpointUrl.protocol !== "https:") return res.status(400).json({ message: "Push subscription endpoint must use HTTPS" });
    const isLocalDomain = appOrigin.hostname === "localhost" || appOrigin.hostname === "127.0.0.1";
    if (appOrigin.protocol !== "https:" && !(isLocalDomain && appOrigin.protocol === "http:")) {
      return res.status(400).json({ message: "App domain must use HTTPS" });
    }

    const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: req.user.id }, select: { domain: true } });
    if (!project) return res.status(404).json({ message: "Project was not found" });
    if (!project.domain || project.domain !== appOrigin.origin) {
      return res.status(403).json({ message: "Open this page on the app domain saved for the selected project" });
    }

    const expirationTime = subscription.expirationTime;
    const expiresAt = Number.isFinite(expirationTime) ? new Date(expirationTime) : null;
    const saved = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { projectId, userId, p256dh, auth, expiresAt },
      create: { projectId, userId, endpoint, p256dh, auth, expiresAt },
      select: { id: true, projectId: true, userId: true, createdAt: true },
    });
    return res.status(201).json({ message: "Browser subscription enabled", data: saved });
  } catch (error) {
    ErrorMsg(error);
    return res.status(500).json({ message: "Unable to save browser subscription" });
  }
}
