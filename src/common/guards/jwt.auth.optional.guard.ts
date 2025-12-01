import { ExecutionContext, HttpException, Inject, Injectable, Optional } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { ClsService } from "nestjs-cls";
import type { ModuleDefinition } from "../decorators/module.decorator";
import type {
  CompanyConfigurationsFactory,
  CompanyConfigurationsInterface,
  Neo4jServiceInterface,
  SystemRolesInterface,
} from "../tokens";
import { COMPANY_CONFIGURATIONS_FACTORY, NEO4J_SERVICE, SYSTEM_ROLES } from "../tokens";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  private readonly neo4j: Neo4jServiceInterface;
  private readonly companyConfigFactory?: CompanyConfigurationsFactory;
  private readonly systemRoles?: SystemRolesInterface;

  constructor(
    private readonly cls: ClsService,
    private reflector: Reflector,
    @Inject(NEO4J_SERVICE) neo4j: Neo4jServiceInterface,
    @Optional() @Inject(COMPANY_CONFIGURATIONS_FACTORY) companyConfigFactory?: CompanyConfigurationsFactory,
    @Optional() @Inject(SYSTEM_ROLES) systemRoles?: SystemRolesInterface,
  ) {
    super();
    this.neo4j = neo4j;
    this.companyConfigFactory = companyConfigFactory;
    this.systemRoles = systemRoles;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader && request.user) {
      return true;
    }

    const isAuthenticated = (await super.canActivate(context)) as boolean;

    if (isAuthenticated && request.user && this.companyConfigFactory) {
      const companyConfigurations = await this.companyConfigFactory({
        companyId: request.user.companyId ?? request.headers["x-companyid"],
        userId: request.user.userId,
        language: request.headers["x-language"],
        roles: request.user.roles,
        neo4j: this.neo4j,
      });
      this.cls.set<CompanyConfigurationsInterface>("companyConfigurations", companyConfigurations);

      this._validateModuleDefinition(request.user, context);
    }

    return super.canActivate(context) as boolean;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    if (!token) return null;

    if (err || !user) {
      if (info?.message === "jwt expired") {
        throw new HttpException("Token expired", 401);
      } else if (err) {
        throw err;
      }
      return null;
    }

    this._validateRoles(user, context);

    this.cls.set("userId", user.userId);
    this.cls.set("companyId", user.companyId ?? request.headers["x-companyid"]);
    this.cls.set("language", request.headers["x-language"]);
    this.cls.set("roles", user.roles);

    return user;
  }

  private _validateRoles(user: any, context: any): void {
    const requiredRoles: string[] = this.reflector.get<string[]>("roles", context.getHandler()) ?? [];
    if (requiredRoles.length > 0) {
      if (!user) throw new HttpException("Unauthorised", 401);
      const adminRole = this.systemRoles?.Administrator ?? "administrator";
      if (!requiredRoles.includes(adminRole)) requiredRoles.push(adminRole);
      if (!requiredRoles.some((role) => user.roles.includes(role))) throw new HttpException("Unauthorised", 401);
    }
  }

  private _validateModuleDefinition(user: any, context: any): void {
    const moduleDefinition: ModuleDefinition | undefined =
      this.reflector.get<ModuleDefinition>("moduleDefinition", context.getHandler()) ||
      this.reflector.get<ModuleDefinition>("moduleDefinition", context.getClass());

    if (moduleDefinition) {
      if (!user && !moduleDefinition.allowVisitors) throw new HttpException("Unauthorised", 401);

      const companyConfigurations = this.cls.get<CompanyConfigurationsInterface>("companyConfigurations");
      if (!companyConfigurations) throw new HttpException("Unauthorised", 401);

      if (!companyConfigurations.hasModule(moduleDefinition.module)) throw new HttpException("Unauthorised", 401);
    }
  }
}
