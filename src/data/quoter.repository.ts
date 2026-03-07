import FetchService from "@/config/fetch";
import { Quoter } from "@/entities/Quoter";

interface GetQuotersResponse {
  success: boolean;
  quotersPending: Quoter[];
  quotersProcess: Quoter[];
  quotersCompleted: Quoter[];
}

interface PatchQuoterResponse {
  success: boolean;
  orderNumber?: number;
  allFinished?: boolean;
  message?: string;
}

export class QuoterRepository {
  private _service: any;
  private static _instance: QuoterRepository;

  constructor(service: any) {
    this._service = service;
  }

  public static instance(token?: string): QuoterRepository {
    return (
      this._instance ?? (this._instance = new this(FetchService._get(token)))
    );
  }

  saveQuoter(body: any): Promise<{ success: boolean; quoterNumber: number }> {
    return this._service.post("/admin/quoter/api", body);
  }

  getQuoters(query?: any): Promise<GetQuotersResponse> {
    return this._service.get("/admin/quoter/api", query?.options);
  }

  markAsPaid(quoterId: string): Promise<PatchQuoterResponse> {
    return this._service.patch("/admin/quoter/api", {
      action: "MARK_PAID",
      quoterId,
    });
  }

  deleteQuoter(quoterId: string): Promise<PatchQuoterResponse> {
    return this._service.patch("/admin/quoter/api", {
      action: "DELETE",
      quoterId,
    });
  }

  toggleProductFinished(quoterId: string, productIndex: number): Promise<PatchQuoterResponse> {
    return this._service.patch("/admin/quoter/api", {
      action: "TOGGLE_PRODUCT",
      quoterId,
      productIndex,
    });
  }

  setInvoiceNumber(quoterId: string, invoiceNumber: string): Promise<PatchQuoterResponse> {
    return this._service.patch("/admin/quoter/api", {
      action: "SET_INVOICE",
      quoterId,
      invoiceNumber,
    });
  }
}
