import { contentCatalog, guideIndex, guidePage, mcqBlock, ospeBlock } from "../services/content.service.js";

const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;

function badSlug() {
  const error = new Error("Not found.");
  error.status = 404;
  return error;
}

function slugs(...values) {
  for (const value of values) if (value !== undefined && value !== "" && !SLUG.test(value)) throw badSlug();
}

// Paid content: each signed-in browser may keep a copy, but must check with
// the server before reusing it (Express adds the ETag, so an unchanged block
// costs a 304). Never stored by a CDN or any shared cache.
function sendPrivate(res, data) {
  res.set({ "Cache-Control": "private, no-cache", Vary: "Cookie, Authorization" });
  res.json({ success: true, data });
}

export async function getCatalog(req, res) {
  sendPrivate(res, await contentCatalog());
}

export async function getGuideIndex(req, res) {
  slugs(req.params.guide);
  sendPrivate(res, await guideIndex(req.params.guide));
}

export async function getGuidePage(req, res) {
  slugs(req.params.guide, req.params.slug);
  sendPrivate(res, await guidePage(req.params.guide, req.params.slug));
}

export async function getMcqBlock(req, res) {
  const topic = typeof req.query.topic === "string" ? req.query.topic : "";
  slugs(req.params.year, req.params.block, topic);
  sendPrivate(res, await mcqBlock(req.params.year, req.params.block, topic));
}

export async function getOspeBlock(req, res) {
  const topic = typeof req.query.topic === "string" ? req.query.topic : "";
  slugs(req.params.year, req.params.block, topic);
  sendPrivate(res, await ospeBlock(req.params.year, req.params.block, topic));
}
