import FetchService from "@/config/fetch";

export class CategoryRepository {
  private _service: any;
  private static _instance: CategoryRepository;

  constructor(service: any) {
    this._service = service;
  }

  public static instance(token?: string): CategoryRepository {
    return (
      this._instance ?? (this._instance = new this(FetchService._get(token)))
    );
  }

  getCategories(query?: any) {
    return this._service.get("/admin/categories/api", query?.options);
  }

  addCategory(body: any) {
    return this._service.post("/admin/categories/api", body);
  }

  editCategory(body: any) {
    return this._service.put("/admin/categories/api", body);
  }

  deleteCategory(id: string) {
    return this._service.delete(`/admin/categories/api/${id}`, { id });
  }
}
