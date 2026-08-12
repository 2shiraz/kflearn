import { HistoryModule } from "../models/HistoryModule.js";
import { getModuleClinicalBundle, getPublishedModuleBySlug, moduleListDto, singlePlayerDto, studentModuleDetailDto } from "../services/history.service.js";

export async function listHistoryModules(req, res) {
  const modules = await HistoryModule.find({ status: "published" }).populate("specialtyId").sort({ updatedAt: -1 });
  res.json({
    success: true,
    data: {
      modules: modules.map(moduleListDto),
      total: modules.length,
    },
  });
}

export async function getHistoryModule(req, res) {
  const module = await getPublishedModuleBySlug(req.params.slug);
  res.json({ success: true, data: studentModuleDetailDto(module) });
}

export async function getSinglePlayerContent(req, res) {
  const module = await getPublishedModuleBySlug(req.params.slug);
  const bundle = await getModuleClinicalBundle(module._id);
  res.json({ success: true, data: singlePlayerDto(bundle) });
}
