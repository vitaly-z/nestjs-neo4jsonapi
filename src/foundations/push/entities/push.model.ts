import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { Push } from "../../push/entities/push.entity";
import { mapPush } from "../../push/entities/push.map";
import { pushMeta } from "../../push/entities/push.meta";

export const PushModel: DataModelInterface<Push> = {
  ...pushMeta,
  entity: undefined as unknown as Push,
  mapper: mapPush,
};
