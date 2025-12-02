import { DataMeta } from "../../../common/interfaces/datamodel.interface";

export const userMeta: DataMeta = {
  type: "users",
  endpoint: "users",
  nodeName: "user",
  labelName: "User",
};

export const ownerMeta: DataMeta = {
  ...userMeta,
  endpoint: "owners",
  nodeName: "owner",
};

export const assigneeMeta: DataMeta = {
  ...userMeta,
  endpoint: "assignees",
  nodeName: "assignee",
};

export const readerMeta: DataMeta = {
  ...userMeta,
  endpoint: "readers",
  nodeName: "reader",
};

export const toUserMeta: DataMeta = {
  ...userMeta,
  endpoint: "tousers",
  nodeName: "touser",
};

export const fromUserMeta: DataMeta = {
  ...userMeta,
  endpoint: "fromusers",
  nodeName: "fromuser",
};

export const ccUserMeta: DataMeta = {
  ...userMeta,
  endpoint: "ccusers",
  nodeName: "ccuser",
};

export const bccUserMeta: DataMeta = {
  ...userMeta,
  endpoint: "bccusers",
  nodeName: "bccuser",
};
