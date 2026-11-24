export class IdentityStorageUnavailable extends Error {
  constructor() {
    super("Identity service temporarily unavailable");
    this.name = "IdentityStorageUnavailable";
  }
}
export type SecurityEvent =
  | "identity.storage_unavailable"
  | "identity.validation_failed"
  | "identity.revocation_failed"
  | "oauth.state_rejected"
  | "oauth.session_created"
  | "oauth.callback_failed"
  | "request.rate_limited"
  | "request.origin_rejected"
  | "request.rpc_failed";
/** No raw errors, cookies, identity fields, provider responses, or arbitrary metadata. */
export function securityEvent(code: SecurityEvent, requestId?: string) {
  const validId =
    requestId &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      requestId
    );
  console.warn(
    JSON.stringify({ event: code, ...(validId ? { requestId } : {}) })
  );
}
