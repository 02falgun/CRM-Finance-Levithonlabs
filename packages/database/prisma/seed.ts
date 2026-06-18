import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Expanded Production-grade Database...');

  // 0. Clean up existing tables in safe order
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.creditNote.deleteMany({});
  await prisma.ebill.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.setting.deleteMany({});
  await prisma.tax.deleteMany({});
  await prisma.leadActivity.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.customerContact.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.companyProfile.deleteMany({});
  await prisma.tenant.deleteMany({});

  // 1. Create Default SaaS Tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      subdomain: 'demo',
      isActive: true,
    },
  });

  console.log(`Created Tenant (Subdomain: ${tenant.subdomain}, ID: ${tenant.id})`);

  // 2. Create Company Profile for the Tenant
  const companyProfile = await prisma.companyProfile.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Levithon Labs Corp. Nepal',
      panNumber: '987654321', // Seller PAN
      email: 'finance@levithonlabs.com',
      phone: '+977-1-4433221',
      address: 'Patan, Lalitpur, Nepal',
    },
  });

  console.log(`Created Company Profile: ${companyProfile.name}`);

  // 3. Seed Permissions Table
  const permissionActions = [
    { action: 'user:read', desc: 'Read user logs' },
    { action: 'user:write', desc: 'Manage user credentials' },
    { action: 'lead:read', desc: 'Read crm leads' },
    { action: 'lead:write', desc: 'Create and update crm leads' },
    { action: 'invoice:read', desc: 'Read bills and sync logs' },
    { action: 'invoice:write', desc: 'Create invoice drafts' },
    { action: 'invoice:print', desc: 'Print invoice and lock/sync to IRD' },
    { action: 'invoice:void', desc: 'Generate credit note returns' },
    { action: 'report:read', desc: 'Read financial audit sheets' },
  ];

  const permissions = [];
  for (const p of permissionActions) {
    const perm = await prisma.permission.upsert({
      where: {
        tenantId_action: {
          tenantId: tenant.id,
          action: p.action,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        action: p.action,
        description: p.desc,
      },
    });
    permissions.push(perm);
  }
  console.log(`Seeded ${permissions.length} permission nodes.`);

  // 4. Seed Roles (TenantAdmin, SalesRep, BillingManager, Auditor)
  const roleDefinitions = [
    { name: 'TENANT_ADMIN', desc: 'Full company manager access', actions: ['user:read', 'user:write', 'lead:read', 'lead:write', 'invoice:read', 'invoice:write', 'invoice:print', 'invoice:void', 'report:read'] },
    { name: 'SALES_REPRESENTATIVE', desc: 'Customer and lead tracker access', actions: ['lead:read', 'lead:write'] },
    { name: 'BILLING_MANAGER', desc: 'Invoices, payments, and e-billing manager access', actions: ['lead:read', 'invoice:read', 'invoice:write', 'invoice:print', 'invoice:void'] },
    { name: 'AUDITOR', desc: 'Read-only tax and compliance audit access', actions: ['invoice:read', 'report:read'] },
  ];

  const roles: Record<string, any> = {};
  for (const r of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: r.name,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: r.name,
        description: r.desc,
      },
    });

    roles[r.name] = role;

    // Map Role permissions
    for (const action of r.actions) {
      const targetPerm = permissions.find(p => p.action === action)!;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: targetPerm.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: targetPerm.id,
        },
      });
    }
  }
  console.log('Seeded Roles & mapped permissions successfully.');

  // 5. Seed Users & assign UserRoles
  const passwordHash = await bcrypt.hash('password123', 10);

  const usersData = [
    { email: 'admin@levithonlabs.com', name: 'Admin Manager', role: 'TENANT_ADMIN' },
    { email: 'sales@levithonlabs.com', name: 'Sales Agent', role: 'SALES_REPRESENTATIVE' },
    { email: 'billing@levithonlabs.com', name: 'Billing Clerk', role: 'BILLING_MANAGER' },
  ];

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        tenantId: tenant.id,
        email: u.email,
        name: u.name,
        passwordHash,
        isActive: true,
      },
    });

    const targetRole = roles[u.role];
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: targetRole.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: targetRole.id,
      },
    });
  }
  console.log('Seeded Users and mapped user roles.');

  // 6. Seed Customers & Contacts
  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Everest Mercantile Ltd.',
      panNumber: '601234567',
      contacts: {
        create: {
          name: 'Shyam Thapa',
          email: 'shyam@everest.com.np',
          phone: '+977-9851098765',
          role: 'Procurement Specialist',
        },
      },
    },
  });

  console.log(`Created customer: ${customer.name}`);

  // 7. Seed CRM Leads & Activities
  const lead = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      title: 'Cloud Billing Setup & Compliancy Migration',
      description: 'Everest is seeking automated real-time IRD synchronization system setup.',
      status: 'QUALIFIED',
      value: 85000.00,
      activities: {
        create: {
          type: 'MEETING',
          note: 'Completed scoping call. Shared compliance details regarding Nepal tax rules.',
          performedBy: 'Sales Agent',
        },
      },
    },
  });

  console.log(`Created Lead: ${lead.title}`);

  // 8. Seed Tax Configs
  const vatTax = await prisma.tax.create({
    data: {
      tenantId: tenant.id,
      name: 'VAT 13%',
      rate: 13.00,
      isExempt: false,
    },
  });

  const exemptTax = await prisma.tax.create({
    data: {
      tenantId: tenant.id,
      name: 'VAT Exempt (Non-Taxable)',
      rate: 0.00,
      isExempt: true,
    },
  });

  console.log(`Created Taxes: ${vatTax.name}, ${exemptTax.name}`);

  // 9. Seed Settings Key-values
  await prisma.setting.create({
    data: {
      tenantId: tenant.id,
      key: 'IRD_API_ENDPOINT',
      value: 'http://202.166.117.75:9090/api/bill',
    },
  });

  await prisma.setting.create({
    data: {
      tenantId: tenant.id,
      key: 'SMS_GATEWAY_API',
      value: 'https://sparrowsms.com/api/v2/sms',
    },
  });

  console.log('Database Expanded Seeding Completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
