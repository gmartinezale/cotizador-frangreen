import FetchService from "@/config/fetch";

export class ProductRepository {
  private _service: any;
  private static _instance: ProductRepository;

  constructor(service: any) {
    this._service = service;
  }

  public static instance(token?: string): ProductRepository {
    return (
      this._instance ?? (this._instance = new this(FetchService._get(token)))
    );
  }

  getProducts(query?: any) {
    return this._service.get("/admin/products/api", query?.options);
  }

  getProduct(id: string) {
    return this._service.get(`/admin/products/api/${id}`);
  }

  addProduct(body: any) {
    return this._service.post("/admin/products/api", body);
  }

  editProduct(body: any) {
    return this._service.put("/admin/products/api", body);
  }

  deleteProduct(id: string) {
    return this._service.delete(`/admin/products/api/${id}`, { id });
  }

  getProductsByCategory(categoryId: string) {
    return this._service.get(`/admin/products/api/category/${categoryId}`);
  }
}
