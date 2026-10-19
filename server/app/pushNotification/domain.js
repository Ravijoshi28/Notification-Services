import { prisma } from "../../lib/database.js";
import { ErrorMsg } from "../../lib/ErrorMsg.js";

function getDomainOrigin(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const input = value.trim();
    const url = new URL(input.includes("://") ? input : `https://${input}`);
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if ((url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

async function getOwnedProject(projectId, userId) {
  if (!projectId) return null;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== userId) return null;
  return project;
}

export async function GetPushConfig(req, res) {
  try {
    const project = await getOwnedProject(req.query.projectId, req.user.id);
    if (!project) return res.status(404).json({ message: "Project was not found" });

    return res.status(200).json({
      message: "Push settings loaded",
      data: { domain: project.domain || "", publicKey: process.env.VAPID_PUBLIC || "" },
    });
  } catch (error) {
    ErrorMsg(error);
    return res.status(500).json({ message: "Unable to load push settings" });
  }
}

export async function SavePushDomain(req, res) {
  try {
    const { projectId, domain } = req.body;
    const origin = getDomainOrigin(domain);
    if (!origin) return res.status(400).json({ message: "Enter a valid HTTPS domain" });

    const project = await getOwnedProject(projectId, req.user.id);
    if (!project) return res.status(404).json({ message: "Project was not found" });

    await prisma.project.update({ where: { id: projectId }, data: { domain: origin } });
    return res.status(200).json({ message: "Push domain saved", data: { domain: origin } });
  } catch (error) {
    ErrorMsg(error);
    return res.status(500).json({ message: "Unable to save push domain" });
  }
}
