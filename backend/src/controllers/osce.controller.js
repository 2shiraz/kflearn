import { OsceStation } from "../models/OsceStation.js";
import { getStationClinicalBundle, getPublishedStationBySlug, stationListDto, singlePlayerDto, studentStationDetailDto } from "../services/osce.service.js";
import { getSiteSettings, sectionClosed } from "../services/siteSettings.service.js";

// Students can't reach the station bank while an admin has the section off.
// With the AI patient off, stations only offer checklist practice.
async function studentAccess(req) {
  const site = await getSiteSettings();
  if (req.user.role !== "admin" && !site.sections.stations) throw sectionClosed();
  return site;
}

function withAccess(dto, site) {
  if (site.aiPatient) return dto;
  const practiceOptions = (dto.practiceOptions || []).filter((mode) => mode !== "virtual-patient");
  return { ...dto, practiceOptions, aiVirtualPatientAvailable: false };
}

export async function listOsceStations(req, res) {
  const site = await studentAccess(req);
  const modules = await OsceStation.find({ status: "published" }).populate("specialtyId").sort({ updatedAt: -1 });
  res.json({
    success: true,
    data: {
      modules: modules.map((module) => withAccess(stationListDto(module), site)),
      total: modules.length,
    },
  });
}

export async function getOsceStation(req, res) {
  const site = await studentAccess(req);
  const module = await getPublishedStationBySlug(req.params.slug);
  res.json({ success: true, data: withAccess(studentStationDetailDto(module), site) });
}

export async function getSinglePlayerContent(req, res) {
  await studentAccess(req);
  const module = await getPublishedStationBySlug(req.params.slug);
  const bundle = await getStationClinicalBundle(module._id);
  res.json({ success: true, data: singlePlayerDto(bundle) });
}
