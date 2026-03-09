import { Schema, model, models } from "mongoose";

interface ISettings {
  shippingCost: number;
}

const SettingsSchema = new Schema<ISettings>(
  {
    shippingCost: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

const Settings = models.Settings || model<ISettings>("Settings", SettingsSchema);

export default Settings;
