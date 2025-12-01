/**
 * Abstract base class for company configurations.
 * Consuming applications should extend this class and implement
 * the loadConfigurations method to load app-specific configuration data.
 */
export abstract class AbstractCompanyConfigurations {
  protected _companyId: string;
  private _userId: string;
  private _roles: string[] = [];
  private _modules: Array<{ id: string; [key: string]: any }> = [];
  private _language?: string;

  constructor(params: { companyId: string; userId: string; language?: string; roles?: string[] }) {
    this._companyId = params.companyId;
    this._userId = params.userId;
    this._language = params.language;
    this._roles = params.roles ?? [];
  }

  /**
   * Abstract method to load configurations from the database.
   * Implement this in your consuming application.
   */
  abstract loadConfigurations(params: { neo4j: any }): Promise<void>;

  protected setModules(modules: Array<{ id: string; [key: string]: any }>): void {
    this._modules = modules;
  }

  get companyId(): string {
    return this._companyId;
  }

  get userId(): string {
    return this._userId;
  }

  get language(): string | undefined {
    return this._language ?? "en";
  }

  get roles(): string[] {
    return this._roles;
  }

  get modules(): Array<{ id: string; [key: string]: any }> {
    return this._modules;
  }

  hasModule(moduleId: string): boolean {
    return !!this._modules.find((m) => m.id === moduleId);
  }

  hasRole(role: string): boolean {
    return this._roles.includes(role);
  }
}
