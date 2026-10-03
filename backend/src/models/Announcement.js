import mongoose from "mongoose";

// A message the admin shows to signed-in students as a banner in the app.
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, default: "", trim: true, maxlength: 500 },
    tone: { type: String, enum: ["info", "success", "warning"], default: "info" },
    linkLabel: { type: String, default: "", trim: true, maxlength: 40 },
    linkHref: { type: String, default: "", trim: true, maxlength: 300 },
    active: { type: Boolean, default: true },
    endsAt: Date,
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Announcement = mongoose.model("Announcement", announcementSchema);
