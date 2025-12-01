export type Entity = {
  id: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;

  recordCount?: number;

  relationshipName?: string;
  labels?: string[];
};

export const mapEntity = (params: { record: any }): Entity => {
  // Determine type from Neo4j labels if available, otherwise use record.type
  let entityType = params.record?.type ?? "";

  // If we have Neo4j labels, use the first one as the type
  if (params.record?.labels && Array.isArray(params.record.labels) && params.record.labels.length > 0) {
    entityType = params.record.labels[0].toLowerCase();
  }

  return {
    id: params.record?.id ?? "",
    type: entityType,
    createdAt: params.record.createdAt ? new Date(params.record.createdAt) : new Date(),
    updatedAt: params.record.updatedAt ? new Date(params.record.updatedAt) : new Date(),

    recordCount: params.record.recordCount,
    labels: params.record?.labels,
  };
};
