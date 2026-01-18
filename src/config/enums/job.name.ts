/**
 * Job name configuration
 * Consumers should override this with their own job names
 */
export const JobName = {
  process: {
    trial: "process_trial",
  } as Record<string, string>,
  notifications: {} as Record<string, string>,
} as const;
