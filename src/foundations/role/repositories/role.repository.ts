import { RoleId } from "../../../common/constants/system.roles";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { JsonApiCursorInterface } from "../../../core/jsonapi/interfaces/jsonapi.cursor.interface";
import { Neo4jService } from "../../../core/neo4j/services/neo4j.service";
import { Role } from "../../role/entities/role.entity";
import { RoleModel } from "../../role/entities/role.model";

@Injectable()
export class RoleRepository implements OnModuleInit {
  constructor(private readonly neo4j: Neo4jService) {}

  async onModuleInit() {
    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT role_id IF NOT EXISTS FOR (role:Role) REQUIRE role.id IS UNIQUE`,
    });
  }

  async findByNameNotId(params: { roleId: string; name: string }): Promise<Role> {
    const query = this.neo4j.initQuery({ serialiser: RoleModel });

    query.queryParams = {
      roleId: params.roleId,
      name: params.name,
    };

    query.query = `
      MATCH (role:Role {name: $name})
      WHERE role.id <> $roleId
      RETURN role
    `;

    return this.neo4j.readOne(query);
  }

  async findByName(params: { name: string }): Promise<Role> {
    const query = this.neo4j.initQuery({ serialiser: RoleModel });

    query.queryParams = {
      name: params.name,
    };

    query.query = `
      MATCH (role:Role {name: $name})
      RETURN role
    `;

    return this.neo4j.readOne(query);
  }

  async findById(params: { roleId: string }): Promise<Role> {
    const query = this.neo4j.initQuery({ serialiser: RoleModel });

    query.queryParams = {
      roleId: params.roleId,
    };

    query.query = `
      MATCH (role:Role {id: $roleId})
      RETURN role
    `;

    return this.neo4j.readOne(query);
  }

  async find(params: { term?: string; cursor: JsonApiCursorInterface }): Promise<Role[]> {
    const query = this.neo4j.initQuery({ serialiser: RoleModel, cursor: params.cursor });

    query.queryParams = {
      term: params.term,
      administratorsId: RoleId.Administrator,
    };

    query.query = `
      MATCH (role:Role)
      WHERE role.id <> $administratorsId
      ${params.term ? "AND toLower(role.name) CONTAINS toLower($term)" : ""}
      
      WITH role
      ORDER BY role.name ASC
      {CURSOR}
      
      RETURN role
    `;

    return this.neo4j.readMany(query);
  }

  async findForUser(params: { userId: string; term?: string; cursor: JsonApiCursorInterface }): Promise<Role[]> {
    const query = this.neo4j.initQuery({ serialiser: RoleModel, cursor: params.cursor });

    query.queryParams = {
      ...query.queryParams,
      userId: params.userId,
      term: params.term,
      administratorsId: RoleId.Administrator,
    };

    query.query += `
      MATCH (user:User {id: $userId})-[:BELONGS_TO]->(company)
      MATCH (user)-[:MEMBER_OF]->(role:Role)
      WHERE role.id <> $administratorsId
      ${params.term ? "AND toLower(role.name) CONTAINS toLower($term)" : ""}
      
      WITH role
      ORDER BY role.name ASC
      {CURSOR}
      
      RETURN role
    `;

    return this.neo4j.readMany(query);
  }

  async findNotInUser(params: { userId: string; term?: string; cursor: JsonApiCursorInterface }): Promise<Role[]> {
    const query = this.neo4j.initQuery({ serialiser: RoleModel, cursor: params.cursor, fetchAll: true });

    query.queryParams = {
      ...query.queryParams,
      userId: params.userId,
      term: params.term,
      administratorsId: RoleId.Administrator,
    };

    query.query += `
      MATCH (user:User {id: $userId})-[:BELONGS_TO]->(company)
      MATCH (role:Role)
      WHERE NOT (role)<-[:MEMBER_OF]-(user)
      ${params.term ? "AND toLower(role.name) CONTAINS toLower($term)" : ""}
      AND role.id <> $administratorsId
      
      WITH role
      ORDER BY role.name ASC
      {CURSOR}
      
      RETURN role
    `;

    return this.neo4j.readMany(query);
  }

  async create(params: { id: string; name: string; description?: string }): Promise<void> {
    const query = this.neo4j.initQuery();

    query.queryParams = {
      ...query.queryParams,
      id: params.id,
      name: params.name,
      description: params.description,
    };

    query.query = `
      CREATE (role:Role {
        id: $id, 
        name: $name, 
        description: $description, 
        createdAt: datetime(), 
        updatedAt: datetime()})
    `;

    await this.neo4j.writeOne(query);
  }

  async update(params: { id: string; name: string; description?: string }): Promise<void> {
    const query = this.neo4j.initQuery();

    query.queryParams = {
      id: params.id,
      name: params.name,
      description: params.description,
    };

    query.query = `
      MATCH (role:Role {id: $id}) 
      SET role.name = $name, 
        role.description = $description, 
        role.updatedAt = datetime()
    `;

    await this.neo4j.writeOne(query);
  }

  async delete(params: { roleId: string }): Promise<void> {
    const query = this.neo4j.initQuery();

    query.queryParams = {
      roleId: params.roleId,
    };

    query.query = `
      MATCH (role:Role {id: $roleId}) 
      DETACH DELETE role
    `;
    await this.neo4j.writeOne(query);
  }
}
