import { TemplateData } from "../types/template-data.interface";
import { isFoundationImport, FOUNDATION_PACKAGE, resolveMetaImportPath } from "../transformers/import-resolver";

/**
 * Generate controller file content with CRUD and nested routes
 *
 * @param data - Template data
 * @returns Generated TypeScript code
 */
export function generateControllerFile(data: TemplateData): string {
  const { names, targetDir, nestedRoutes } = data;

  // Separate OLD and NEW structure routes
  const oldStructureRoutes = nestedRoutes.filter((route) => !route.isNewStructure);
  const newStructureRoutes = nestedRoutes.filter((route) => route.isNewStructure);

  // Build meta imports for OLD structure nested routes
  const oldMetaImportPaths = new Map<string, string[]>();
  for (const route of oldStructureRoutes) {
    const rel = data.relationships.find((r) => r.model === route.relatedMeta)!;
    const path = isFoundationImport(rel.relatedEntity.directory)
      ? FOUNDATION_PACKAGE
      : resolveMetaImportPath({
          fromDir: targetDir,
          fromModule: names.kebabCase,
          toDir: rel.relatedEntity.directory,
          toModule: rel.relatedEntity.kebabCase,
        });
    if (!oldMetaImportPaths.has(path)) {
      oldMetaImportPaths.set(path, []);
    }
    if (!oldMetaImportPaths.get(path)!.includes(route.relatedMeta)) {
      oldMetaImportPaths.get(path)!.push(route.relatedMeta);
    }
  }

  // Build Descriptor imports for NEW structure nested routes
  const newDescriptorImportPaths = new Map<string, string[]>();
  for (const route of newStructureRoutes) {
    if (route.importPath && route.descriptorName) {
      if (!newDescriptorImportPaths.has(route.importPath)) {
        newDescriptorImportPaths.set(route.importPath, []);
      }
      if (!newDescriptorImportPaths.get(route.importPath)!.includes(route.descriptorName)) {
        newDescriptorImportPaths.get(route.importPath)!.push(route.descriptorName);
      }
    }
  }

  // Combine all import lines
  const importLines: string[] = [];
  for (const [path, items] of oldMetaImportPaths.entries()) {
    importLines.push(`import { ${items.join(", ")} } from "${path}";`);
  }
  for (const [path, items] of newDescriptorImportPaths.entries()) {
    importLines.push(`import { ${items.join(", ")} } from "${path}";`);
  }

  const metaImportsCode = importLines.length > 0 ? `\n${importLines.join("\n")}\n` : "";

  // Generate nested route methods
  // The route.path is pre-computed by nested-route-generator with correct endpoint access pattern
  const nestedRouteMethods = nestedRoutes
    .map(
      (route) => `
  @Get(\`${route.path}\`)
  async ${route.methodName}(
    @Req() req: AuthenticatedRequest,
    @Res() reply: FastifyReply,
    @Param("${route.paramName}") ${route.paramName}: string,
    @Query() query: any,
    @Query("search") search?: string,
    @Query("fetchAll") fetchAll?: boolean,
    @Query("orderBy") orderBy?: string,
  ) {
    const response = await this.${names.camelCase}Service.findByRelated({
      relationship: ${names.pascalCase}Descriptor.relationshipKeys.${route.relationshipKey},
      id: ${route.paramName},
      term: search,
      query: query,
      fetchAll: fetchAll,
      orderBy: orderBy,
    });

    reply.send(response);
  }`
    )
    .join("\n");

  return `import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  PreconditionFailedException,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { FastifyReply } from "fastify";
import {
  AuditService,
  AuthenticatedRequest,
  CacheService,
  JsonApiDTOData,
  JwtAuthGuard,
} from "@carlonicora/nestjs-neo4jsonapi";${metaImportsCode}
import { ${names.pascalCase}PostDTO } from "src/${targetDir}/${names.kebabCase}/dtos/${names.kebabCase}.post.dto";
import { ${names.pascalCase}PutDTO } from "src/${targetDir}/${names.kebabCase}/dtos/${names.kebabCase}.put.dto";
import { ${names.pascalCase}Descriptor } from "src/${targetDir}/${names.kebabCase}/entities/${names.kebabCase}";
import { ${names.pascalCase}Service } from "src/${targetDir}/${names.kebabCase}/services/${names.kebabCase}.service";

@UseGuards(JwtAuthGuard)
@Controller()
export class ${names.pascalCase}Controller {
  constructor(
    private readonly ${names.camelCase}Service: ${names.pascalCase}Service,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
  ) {}

  @Get(${names.pascalCase}Descriptor.model.endpoint)
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Res() reply: FastifyReply,
    @Query() query: any,
    @Query("search") search?: string,
    @Query("fetchAll") fetchAll?: boolean,
    @Query("orderBy") orderBy?: string,
  ) {
    const response = await this.${names.camelCase}Service.find({
      term: search,
      query: query,
      fetchAll: fetchAll,
      orderBy: orderBy,
    });

    reply.send(response);
  }

  @Get(\`\${${names.pascalCase}Descriptor.model.endpoint}/:${names.camelCase}Id\`)
  async findById(
    @Req() req: AuthenticatedRequest,
    @Res() reply: FastifyReply,
    @Param("${names.camelCase}Id") ${names.camelCase}Id: string,
  ) {
    const response = await this.${names.camelCase}Service.findById({
      id: ${names.camelCase}Id,
    });

    reply.send(response);

    this.auditService.createAuditEntry({
      entityType: ${names.pascalCase}Descriptor.model.labelName,
      entityId: ${names.camelCase}Id,
    });
  }

  @Post(${names.pascalCase}Descriptor.model.endpoint)
  async create(
    @Req() req: AuthenticatedRequest,
    @Res() reply: FastifyReply,
    @Body() body: ${names.pascalCase}PostDTO,
  ) {
    const response = await this.${names.camelCase}Service.createFromDTO({
      data: body.data as unknown as JsonApiDTOData,
    });

    reply.send(response);

    await this.cacheService.invalidateByType(${names.pascalCase}Descriptor.model.endpoint);
  }

  @Put(\`\${${names.pascalCase}Descriptor.model.endpoint}/:${names.camelCase}Id\`)
  async update(
    @Req() req: AuthenticatedRequest,
    @Res() reply: FastifyReply,
    @Param("${names.camelCase}Id") ${names.camelCase}Id: string,
    @Body() body: ${names.pascalCase}PutDTO,
  ) {
    if (${names.camelCase}Id !== body.data.id)
      throw new PreconditionFailedException("ID in URL does not match ID in body");

    const response = await this.${names.camelCase}Service.putFromDTO({
      data: body.data as unknown as JsonApiDTOData,
    });

    reply.send(response);

    await this.cacheService.invalidateByElement(${names.pascalCase}Descriptor.model.endpoint, body.data.id);
  }

  @Delete(\`\${${names.pascalCase}Descriptor.model.endpoint}/:${names.camelCase}Id\`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Req() req: AuthenticatedRequest,
    @Res() reply: FastifyReply,
    @Param("${names.camelCase}Id") ${names.camelCase}Id: string,
  ) {
    await this.${names.camelCase}Service.delete({ id: ${names.camelCase}Id });
    reply.send();

    await this.cacheService.invalidateByElement(${names.pascalCase}Descriptor.model.endpoint, ${names.camelCase}Id);
  }
${nestedRouteMethods}
}
`;
}
