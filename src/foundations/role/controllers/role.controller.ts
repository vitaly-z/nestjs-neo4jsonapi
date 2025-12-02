import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../../common/guards/jwt.auth.guard";
import { RolePostDTO } from "../../role/dtos/role.post.dto";
import { roleMeta } from "../../role/entities/role.meta";
import { RoleService } from "../services/role.service";

@Controller(roleMeta.endpoint)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  @Get()
  async find(@Query() query: any, @Query("search") search?: string) {
    return await this.roleService.find({ term: search, query: query });
  }

  @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  @Get(":roleId")
  async findById(@Param("roleId") roleId: string) {
    return await this.roleService.findById({ roleId: roleId });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: RolePostDTO) {
    await this.roleService.expectNotExists({
      name: body.data.attributes.name,
    });

    return await this.roleService.create({
      data: body.data,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put(":roleId")
  async update(@Body() body: RolePostDTO, @Param("roleId") roleId: string) {
    if (roleId !== body.data.id)
      throw new HttpException("Role id does not match the {json:api} id", HttpStatus.PRECONDITION_FAILED);

    return await this.roleService.update({
      data: body.data,
    });
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":roleId")
  async delete(@Param("roleId") roleId: string) {
    await this.roleService.delete({
      roleId: roleId,
    });
  }
}
