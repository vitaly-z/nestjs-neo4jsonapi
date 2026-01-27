import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { PendingAuth } from "./pending-auth.entity";
import { mapPendingAuth } from "./pending-auth.map";
import { pendingAuthMeta } from "./pending-auth.meta";
import { PendingAuthSerialiser } from "../serialisers/pending-auth.serialiser";

/**
 * Model for PendingAuth - represents a 2FA pending authentication response.
 * Returned when a user with 2FA enabled successfully validates their password
 * but still needs to complete 2FA verification.
 */
export const PendingAuthModel: DataModelInterface<PendingAuth> = {
  ...pendingAuthMeta,
  entity: undefined as unknown as PendingAuth,
  mapper: mapPendingAuth,
  serialiser: PendingAuthSerialiser,
  singleChildrenTokens: [],
};
