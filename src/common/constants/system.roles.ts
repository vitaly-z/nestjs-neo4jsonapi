/**
 * System roles - these are the base roles provided by the library.
 * Applications can extend this with their own roles.
 */
export const SystemRoles = {
  Administrator: "53394cb8-1e87-11ef-8b48-bed54b8f8aba",
  CompanyAdministrator: "2e1eee00-6cba-4506-9059-ccd24e4ea5b0",
} as const;

export type SystemRoleId = (typeof SystemRoles)[keyof typeof SystemRoles];

/**
 * RoleId - alias for SystemRoles for backward compatibility.
 * Applications should extend this with their own roles.
 */
export const RoleId = {
  ...SystemRoles,
} as const;
