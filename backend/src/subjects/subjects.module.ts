import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service.js';
import { SubjectsController } from './subjects.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}

