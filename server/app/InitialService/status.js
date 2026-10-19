import { prisma } from "../../lib/database.js";

export async function GetServiceStatus(req, res) {
  const { channel, id } = req.params;
  if (!id || !["email", "push"].includes(channel)) {
    return res.status(400).json({ message: "A valid channel and request id are required" });
  }

  try {
    const record = channel === "email"
      ? await prisma.email.findFirst({ where: { id, projectId: req.projectId }, select: { id: true, status: true, error: true, sentAt: true, attempts: true, updatedAt: true } })
      : await prisma.pushNotification.findFirst({ where: { id, projectId: req.projectId }, select: { id: true, status: true, error: true, sentAt: true, attempts: true, updatedAt: true } });

    if (!record) return res.status(404).json({ message: "Request was not found for this project" });
    return res.status(200).json({ message: "Delivery status loaded", data: record });
  } catch {
    return res.status(500).json({ message: "Unable to load delivery status" });
  }
}
