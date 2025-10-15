import type { Middleware as _Middleware } from "openapi-fetch";

export interface Middleware {
    onRequest: Extract<_Middleware["onRequest"], (...args: any[]) => any>;
}
