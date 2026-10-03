import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedOsceContent } from "./osce.seed.js";
import { seedCvsOsceStations } from "./cvsOsce.seed.js";
import { seedEndocrinology15OsceStations } from "./endocrinology15Osce.seed.js";

await connectDatabase();
const result = await seedOsceContent();
console.log(`Seeded OSCE station: ${result.module.title}`);
for (const module of result.respiratoryOsceStations) {
  console.log(`Seeded OSCE station: ${module.title}`);
}
for (const module of result.gynaecologyOsceStations) {
  console.log(`Seeded OSCE station: ${module.title}`);
}
for (const module of result.endocrinologyOsceStations) {
  console.log(`Seeded OSCE station: ${module.title}`);
}
for (const module of result.gastroenterologyOsceStations) {
  console.log(`Seeded OSCE station: ${module.title}`);
}
for (const module of await seedCvsOsceStations()) {
  console.log(`Seeded OSCE station: ${module.title}`);
}
for (const module of await seedEndocrinology15OsceStations()) {
  console.log(`Seeded OSCE station: ${module.title}`);
}
await disconnectDatabase();
