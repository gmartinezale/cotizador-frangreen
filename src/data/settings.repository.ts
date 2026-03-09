import FetchService from "@/config/fetch";

interface Settings {
  shippingCost: number;
}

interface GetSettingsResponse {
  success: boolean;
  settings: Settings;
}

interface UpdateSettingsResponse {
  success: boolean;
  settings: Settings;
}

export class SettingsRepository {
  private _service: any;
  private static _instance: SettingsRepository;

  constructor(service: any) {
    this._service = service;
  }

  public static instance(token?: string): SettingsRepository {
    return (
      this._instance ?? (this._instance = new this(FetchService._get(token)))
    );
  }

  getSettings(): Promise<GetSettingsResponse> {
    return this._service.get("/admin/settings/api");
  }

  updateSettings(body: Settings): Promise<UpdateSettingsResponse> {
    return this._service.put("/admin/settings/api", body);
  }
}
