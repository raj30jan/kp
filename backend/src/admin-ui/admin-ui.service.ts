import { Injectable } from '@nestjs/common'
import { AdminUsersService } from '../admin-users/admin-users.service'
import { ProductService } from '../marketplace/product.service'
import { ComplaintsService } from '../complaints/complaints.service'
import { MembershipService } from '../membership/membership.service'

@Injectable()
export class AdminUiService {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly productService: ProductService,
    private readonly complaintsService: ComplaintsService,
    private readonly membershipService: MembershipService,
  ) {}

  /** Aggregates KPIs from every module for the admin dashboard landing page. */
  async getDashboardStats() {
    const [userStats, productCounts, complaintCounts, activeSubscriptions] = await Promise.all([
      this.adminUsersService.getStats(),
      this.productService.countsByStatus(),
      this.complaintsService.countsByStatus(),
      this.membershipService.countActiveSubscriptions(),
    ])

    return {
      totalUsers: userStats.totalUsers,
      usersByRole: userStats.byRole,
      products: {
        pending: productCounts.pending || 0,
        active: productCounts.active || 0,
        expired: productCounts.expired || 0,
        rejected: productCounts.rejected || 0,
        total: Object.values(productCounts).reduce((a: number, b) => a + Number(b), 0),
      },
      complaints: {
        open: complaintCounts.open || 0,
        in_review: complaintCounts.in_review || 0,
        resolved: complaintCounts.resolved || 0,
        rejected: complaintCounts.rejected || 0,
        total: Object.values(complaintCounts).reduce((a: number, b) => a + Number(b), 0),
      },
      activeSubscriptions,
    }
  }
}
