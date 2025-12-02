import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { Feature } from "../../feature/entities/feature.entity";
import { mapFeature } from "../../feature/entities/feature.map";
import { featureMeta } from "../../feature/entities/feature.meta";
import { FeatureSerialiser } from "../../feature/serialisers/feature.serialiser";
import { moduleMeta } from "../../module/entities/module.meta";

export const FeatureModel: DataModelInterface<Feature> = {
  ...featureMeta,
  entity: undefined as unknown as Feature,
  mapper: mapFeature,
  serialiser: FeatureSerialiser,
  childrenTokens: [moduleMeta.nodeName],
};
