import Cookie from "js-cookie";

export default class FetchService {
  private static _instance: FetchService;
  private _isClient = typeof window !== "undefined";
  private BASE_URL: string = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  private headers: Record<string, string> = {
    "content-type": "application/json",
  };

  private nextOptions: any = { revalidate: 0 };

  private applyOptions(
    path: string,
    options: any = {},
    body?: object,
  ): { url: URL; newOptions: object } {
    const { headers, params, nextOptions } = options;
    const reqHeaders = { ...this.headers };
    const url = new URL(this.BASE_URL + path);
    const newNextOptions = { ...this.nextOptions };

    if (headers) {
      Object.keys(headers).forEach((key) => {
        reqHeaders[key] = headers[key];
      });
    }

    if (params) {
      Object.keys(params).forEach((key) => {
        url.searchParams.append(key, `${params[key]}`);
      });
    }

    if (nextOptions) {
      Object.keys(nextOptions).forEach((key) => {
        newNextOptions[key] = nextOptions[key];
      });
    }

    if (body instanceof FormData) {
      delete reqHeaders["content-type"];
    }

    const newOptions = {
      headers: reqHeaders,
      next: newNextOptions,
    };

    return { url, newOptions };
  }
  constructor() {
    // If we are creating a client-side instance, get token from cookie
    if (this._isClient) {
      this._setTokenFromCookie();
    }
  }

  private _setTokenFromCookie() {
    // Get token from cookies
    const token = Cookie.get("next-auth.session-token");
    // If token exists, assign authorization header
    if (token) {
      this.setAuthHeader(token);
    }
  }

  setAuthHeader(token?: string): void {
    if (token) {
      this.headers["cookie"] = `session=${token}`;
    } else {
      delete this.headers["cookie"];
    }
  }

  async get(path: string, options?: any): Promise<any> {
    const { url, newOptions } = this.applyOptions(path, options);
    console.log('Fetching URL:', url.toString());
    const res = await fetch(url, {
      ...newOptions,
      method: "GET",
    });
    return res.json();
  }

  async post(path: string, body: object, options?: any): Promise<any> {
    const { url, newOptions } = this.applyOptions(path, options, body);
    const res = await fetch(url, {
      ...newOptions,
      method: "POST",
      body:
        body instanceof FormData ? (body as FormData) : JSON.stringify(body),
    });
    return res.json();
  }

  async put(path: string, body: object, options?: any): Promise<any> {
    const { url, newOptions } = this.applyOptions(path, options, body);
    const res = await fetch(url, {
      ...newOptions,
      method: "PUT",
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async patch(path: string, body: object, options?: any): Promise<any> {
    const { url, newOptions } = this.applyOptions(path, options, body);
    const res = await fetch(url, {
      ...newOptions,
      method: "PATCH",
      body:
        body instanceof FormData ? (body as FormData) : JSON.stringify(body),
    });
    return res.json();
  }

  async delete(path: string, options?: any): Promise<any> {
    const { url, newOptions } = this.applyOptions(path, options);
    const res = await fetch(url, {
      ...newOptions,
      method: "DELETE",
    });
    return res.json();
  }

  /**
   * Gets an existing instance of the FetchService class. If no instance exists, creates a new one.
   * @returns {FetchService}
   */
  static _getClientInstance(): FetchService {
    return this._instance ?? (this._instance = new this());
  }

  /**
   * Gets an server instance of the FetchService class and adds the token to the headers.
   * If no instance exists, creates a new one.
   * @param {string} token - token to include on the auth header
   * @returns {FetchService}
   */
  static _getServerInstance(token?: string): FetchService {
    if (!this._instance) {
      this._instance = new this();
    }
    this._instance.setAuthHeader(token);

    return this._instance;
  }

  /**
   * Convenience method to get an instance of the FetchService class that handles an optional jwt param
   * depending if we are client or server side.
   * @param {string} token - token to include on the auth header
   * @returns {FetchService}
   */
  public static _get(token?: string): FetchService {
    return token ? this._getServerInstance(token) : this._getClientInstance();
  }
}
