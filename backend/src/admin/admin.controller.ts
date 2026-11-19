import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';
import { AdminService } from './admin.service.js';
import { AdminCreateUserDto } from './dto/create-user.dto.js';
import { AdminCreateSubjectDto } from './dto/create-subject.dto.js';
import { AdminCreateLessonDto } from './dto/create-lesson.dto.js';
import { AdminCreateQuestionDto } from './dto/create-question.dto.js';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.getDashboard(admin.username);
  }

  // ==================== USER MANAGEMENT ====================
  @Get('users')
  async listUsers(@Query('search') search?: string) {
    return this.adminService.listUsers(search);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() dto: AdminCreateUserDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminService.createUser(dto, admin.userId);
  }

  @Post('users/:id/reset-device')
  @HttpCode(HttpStatus.OK)
  async resetDevice(
    @Param('id') id: string,
    @Body() body: { transferType: 'TRANSFER' | 'RECOVERY'; reason: string },
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminService.resetDevice(id, body, admin);
  }

  @Post('users/:id/revoke-session')
  @HttpCode(HttpStatus.OK)
  async revokeUserSession(@Param('id') id: string) {
    return this.adminService.revokeUserSession(id);
  }

  @Get('device-transfers')
  async getDeviceTransfers(@Query('userId') userId?: string) {
    return this.adminService.getDeviceTransferAudits(userId);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { fullName?: string },
  ) {
    return this.adminService.updateUser(id, body);
  }

  @Post('users/:id/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetUserPassword(
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    return this.adminService.resetUserPassword(id, password);
  }

  @Patch('users/:id/toggle-active')
  async toggleUserActive(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.toggleUserActive(id, isActive);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ==================== SUBJECT ACCESS & AUDIT ====================
  @Get('users/:id/access')
  async getUserAccess(@Param('id') id: string) {
    return this.adminService.getUserAccess(id);
  }

  @Post('users/:id/access')
  @HttpCode(HttpStatus.OK)
  async setUserAccess(
    @Param('id') id: string,
    @Body('subjectIds') subjectIds: string[],
    @Body('note') note: string | undefined,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminService.setUserAccess(id, subjectIds || [], admin, note);
  }

  @Post('grant-access')
  @HttpCode(HttpStatus.OK)
  async grantAccess(
    @Body('userId') userId: string,
    @Body('subjectId') subjectId: string,
    @Body('note') note: string | undefined,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminService.grantAccess(userId, subjectId, admin, note);
  }

  @Post('revoke-access')
  @HttpCode(HttpStatus.OK)
  async revokeAccess(
    @Body('userId') userId: string,
    @Body('subjectId') subjectId: string,
    @Body('note') note: string | undefined,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminService.revokeAccess(userId, subjectId, admin, note);
  }

  @Get('audit-logs')
  async getAuditLogs(@Query('limit') limit?: string) {
    return this.adminService.getAuditLogs(limit ? parseInt(limit, 10) : 100);
  }

  // ==================== CONTENT MANAGEMENT ====================
  // --- SUBJECTS ---
  @Post('subjects')
  async createSubject(@Body() dto: AdminCreateSubjectDto) {
    return this.adminService.createSubject(dto);
  }

  @Patch('subjects/:id')
  async updateSubject(
    @Param('id') id: string,
    @Body() dto: Partial<AdminCreateSubjectDto>,
  ) {
    return this.adminService.updateSubject(id, dto);
  }

  @Patch('subjects/:id/toggle-publish')
  async togglePublishSubject(@Param('id') id: string) {
    return this.adminService.togglePublishSubject(id);
  }

  // --- LESSONS ---
  @Post('subjects/:subjectId/lessons')
  async createLesson(
    @Param('subjectId') subjectId: string,
    @Body() dto: AdminCreateLessonDto,
  ) {
    return this.adminService.createLesson(subjectId, dto);
  }

  @Patch('lessons/:id')
  async updateLesson(
    @Param('id') id: string,
    @Body() dto: Partial<AdminCreateLessonDto>,
  ) {
    return this.adminService.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  async deleteLesson(@Param('id') id: string) {
    return this.adminService.deleteLesson(id);
  }

  // --- QUESTIONS & OPTIONS ---
  @Get('questions')
  async getQuestions(
    @Query('lessonId') lessonId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.adminService.getQuestions(lessonId, subjectId);
  }

  @Post('questions')
  async createQuestion(@Body() dto: AdminCreateQuestionDto) {
    return this.adminService.createQuestion(dto);
  }

  @Patch('questions/:id')
  async updateQuestion(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateQuestion(id, data);
  }

  @Delete('questions/:id')
  async deleteQuestion(@Param('id') id: string) {
    return this.adminService.deleteQuestion(id);
  }
}
