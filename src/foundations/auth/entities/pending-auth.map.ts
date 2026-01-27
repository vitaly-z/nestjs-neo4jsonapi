import { PendingAuth } from "./pending-auth.entity";

/**
 * Map raw data to PendingAuth entity.
 */
export function mapPendingAuth(data: any): PendingAuth {
  return {
    pendingId: data.pendingId,
    token: data.token,
    expiration: data.expiration instanceof Date ? data.expiration : new Date(data.expiration),
    availableMethods: data.availableMethods ?? [],
    preferredMethod: data.preferredMethod,
  };
}
