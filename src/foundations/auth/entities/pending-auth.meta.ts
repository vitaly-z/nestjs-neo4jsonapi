import { DataMeta } from "../../../common/interfaces/datamodel.interface";

export const pendingAuthMeta: DataMeta = {
  type: "two-factor-challenge",
  endpoint: "two-factor-challenge",
  nodeName: "pendingAuth",
  labelName: "PendingAuth",
};
