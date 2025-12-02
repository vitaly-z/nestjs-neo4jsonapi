export const orderBy = (params: {
  nodeName: string;
  hasTerm?: boolean;
  orderBy?: string;
  startDate?: Date;
  endDate?: Date;
}): { startDateCondition: string; endDateCondition: string } => {
  const orderBy = params.orderBy
    ? params.orderBy.endsWith(" DESC")
      ? params.orderBy.substring(0, params.orderBy.length - 5)
      : params.orderBy.endsWith(" ASC")
        ? params.orderBy.substring(0, params.orderBy.length - 4)
        : params.orderBy
    : "";

  let startDateCondition = "";
  if (params.startDate) {
    if (orderBy === "updatedAt") {
      startDateCondition = `${params.hasTerm ? `AND` : `WHERE`} ${params.nodeName}.updatedAt >= datetime($startDate)`;
    } else {
      startDateCondition = `${params.hasTerm ? `AND` : `WHERE`} ${params.nodeName}.createdAt >= datetime($startDate)`;
    }
  }
  let endDateCondition = "";
  if (params.endDate) {
    if (orderBy === "updatedAt") {
      endDateCondition = `${params.hasTerm || params.startDate ? `AND` : `WHERE`} ${params.nodeName}.updatedAt <= datetime($endDate)`;
    } else {
      endDateCondition = `${params.hasTerm || params.startDate ? `AND` : `WHERE`} ${params.nodeName}.createdAt <= datetime($endDate)`;
    }
  }

  return {
    startDateCondition: startDateCondition,
    endDateCondition: endDateCondition,
  };
};
