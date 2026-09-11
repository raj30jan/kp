import { Module } from '@nestjs/common'
import { AdminUsersModule } from '../admin-users/admin-users.module'
import { MarketplaceModule } from '../marketplace/marketplace.module'
import { ComplaintsModule } from '../complaints/complaints.module'
import { MembershipModule } from '../membership/membership.module'
import { ServiceInterestModule } from '../service-interest/service-interest.module'
import { AdminUiController } from './admin-ui.controller'
import { AdminUiService } from './admin-ui.service'
import { AdminSessionGuard } from './admin-session.guard'
import { SuperAdminSessionGuard } from './super-admin-session.guard'
import { AccountsUiController } from './controllers/accounts-ui.controller'
import { ProductsUiController } from './controllers/products-ui.controller'
import { MembershipsUiController } from './controllers/memberships-ui.controller'
import { ComplaintsUiController } from './controllers/complaints-ui.controller'
import { LeadsUiController } from './controllers/leads-ui.controller'

/**
 * Backend Admin UI (SRS §3.3, Section 2) — server-side rendered EJS panel
 * at /admin/*. Reuses the exact same service classes as the Swagger API
 * layer (Section 1); no duplicate business logic or direct DB access.
 * AuthModule is @Global() so AuthService/JwtModule are already available.
 */
@Module({
  imports: [AdminUsersModule, MarketplaceModule, ComplaintsModule, MembershipModule, ServiceInterestModule],
  controllers: [
    AdminUiController,
    AccountsUiController,
    ProductsUiController,
    MembershipsUiController,
    ComplaintsUiController,
    LeadsUiController,
  ],
  providers: [AdminUiService, AdminSessionGuard, SuperAdminSessionGuard],
})
export class AdminUiModule {}
