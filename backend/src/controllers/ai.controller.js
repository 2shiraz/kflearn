export async function getAiStatus(req, res) {
  res.json({ success: true, data: { provider: "groq", configured: Boolean(process.env.GROQ_API_KEY) } });
}
