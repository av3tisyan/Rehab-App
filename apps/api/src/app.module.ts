import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DbModule } from './db/db.module';
import { AuditModule } from './common/audit/audit.module';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { RolesGuard } from './common/roles.guard';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { EpisodesModule } from './episodes/episodes.module';
import { EncountersModule } from './encounters/encounters.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { CatalogModule } from './catalog/catalog.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { GoalsModule } from './goals/goals.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    DbModule,
    AuditModule,
    AuthModule,
    PatientsModule,
    EpisodesModule,
    EncountersModule,
    AssessmentsModule,
    CatalogModule,
    GoalsModule,
    DocumentsModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [
    // Secure by default: every route requires a valid token unless @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Enforce @Roles(...) — runs after JwtAuthGuard (needs request.user).
    { provide: APP_GUARD, useClass: RolesGuard },
    // Audit all successful mutations.
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
