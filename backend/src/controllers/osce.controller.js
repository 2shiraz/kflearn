import { OsceStation } from "../models/OsceStation.js";
import { getStationClinicalBundle, getPublishedStationBySlug, stationListDto, singlePlayerDto, studentStationDetailDto } from "../services/osce.service.js";

export async function listOsceStations(req, res) {
  const modules = await OsceStation.find({ status: "published" }).populate("specialtyId").sort({ updatedAt: -1 });
  res.json({
    success: true,
    data: {
      modules: modules.map(stationListDto),
      total: modules.length,
    },
  });
}

export async function getOsceStation(req, res) {
  const module = await getPublishedStationBySlug(req.params.slug);
  res.json({ success: true, data: studentStationDetailDto(module) });
}

export async function getSinglePlayerContent(req, res) {
  const module = await getPublishedStationBySlug(req.params.slug);
  const bundle = await getStationClinicalBundle(module._id);
  res.json({ success: true, data: singlePlayerDto(bundle) });
}
