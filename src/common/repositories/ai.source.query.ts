import { DataLimits } from "../types/data.limits";

/**
 * Helper function to build AI source queries.
 * This is a generic implementation that can be extended by consuming apps.
 */
export const aiSourceQuery = (params: {
  currentUserId?: string;
  securityService?: any;
  dataLimits: DataLimits;
  returnsData?: boolean;
  returnsKeyConcepts?: boolean;
}) => {
  let response = ``;

  if (params.returnsData) {
    response += `
      WITH data
    `;
  } else if (params.returnsKeyConcepts) {
    response += `
      WITH keyconcept
      `;
  }

  return response;
};
