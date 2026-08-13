import { getAiSettingsDto, updateAiSettings } from "../services/aiSettings.service.js";

export async function getAiStatus(req, res) {
  res.json({ success: true, data: await getAiSettingsDto() });
}

export async function updateAiStatus(req, res) {
  res.json({ success: true, data: await updateAiSettings(req.body) });
}
