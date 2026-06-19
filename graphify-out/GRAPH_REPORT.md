# Graph Report - C:\Users\kt708\OneDrive\Documents\Next js project\ebillingLevithonlabs\CRM-Finance-Levithonlabs  (2026-06-19)

## Corpus Check
- 67 files · ~333,766 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 370 nodes · 423 edges · 52 communities detected
- Extraction: 89% EXTRACTED · 10% INFERRED · 1% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_.getCustomerTimeline|.getCustomerTimeline]]
- [[_COMMUNITY_generateIrdVerificationHash|generateIrdVerificationHash]]
- [[_COMMUNITY_Brand Color Palette (Red|Brand Color Palette (Red]]
- [[_COMMUNITY_.generateQuotationPdf|.generateQuotationPdf]]
- [[_COMMUNITY_handleConvertToInvoice|handleConvertToInvoice]]
- [[_COMMUNITY_getSessionTenant|getSessionTenant]]
- [[_COMMUNITY_.sendPasswordResetEmail|.sendPasswordResetEmail]]
- [[_COMMUNITY_EbillingController|EbillingController]]
- [[_COMMUNITY_toggleCustomerActiveState|toggleCustomerActiveState]]
- [[_COMMUNITY_Circular Badge Emblem Layout|Circular Badge Emblem Layout]]
- [[_COMMUNITY_Levithonlabs Innovation Private Limited|Levithonlabs Innovation Private Limited]]
- [[_COMMUNITY_.toggleUserActive|.toggleUserActive]]
- [[_COMMUNITY_.toggleUserActive|.toggleUserActive]]
- [[_COMMUNITY_.getDashboardStats|.getDashboardStats]]
- [[_COMMUNITY_CreateCustomerContactDto|CreateCustomerContactDto]]
- [[_COMMUNITY_.getNotifications|.getNotifications]]
- [[_COMMUNITY_.resetPassword|.resetPassword]]
- [[_COMMUNITY_CreateCreditNoteDto|CreateCreditNoteDto]]
- [[_COMMUNITY_.canActivate|.canActivate]]
- [[_COMMUNITY_handleDownloadReceipt|handleDownloadReceipt]]
- [[_COMMUNITY_PermissionsGuard|PermissionsGuard]]
- [[_COMMUNITY_.constructor|.constructor]]
- [[_COMMUNITY_AuditInterceptor|AuditInterceptor]]
- [[_COMMUNITY_TenantMiddleware|TenantMiddleware]]
- [[_COMMUNITY_CreateTenantUserDto|CreateTenantUserDto]]
- [[_COMMUNITY_handleToggleActive|handleToggleActive]]
- [[_COMMUNITY_AppModule|AppModule]]
- [[_COMMUNITY_bootstrap|bootstrap]]
- [[_COMMUNITY_RequirePermissions|RequirePermissions]]
- [[_COMMUNITY_Roles|Roles]]
- [[_COMMUNITY_AuthModule|AuthModule]]
- [[_COMMUNITY_LoginDto|LoginDto]]
- [[_COMMUNITY_RegisterDto|RegisterDto]]
- [[_COMMUNITY_CrmModule|CrmModule]]
- [[_COMMUNITY_IntegrationModule|IntegrationModule]]
- [[_COMMUNITY_PrismaModule|PrismaModule]]
- [[_COMMUNITY_SalesModule|SalesModule]]
- [[_COMMUNITY_TenantModule|TenantModule]]
- [[_COMMUNITY_UtilityModule|UtilityModule]]
- [[_COMMUNITY_RootLayout|RootLayout]]
- [[_COMMUNITY_RootPage|RootPage]]
- [[_COMMUNITY_fetchDashboard|fetchDashboard]]
- [[_COMMUNITY_fetchLogs|fetchLogs]]
- [[_COMMUNITY_SettingsPage|SettingsPage]]
- [[_COMMUNITY_request|request]]
- [[_COMMUNITY_main|main]]
- [[_COMMUNITY_next-env d|next-env d]]
- [[_COMMUNITY_next config|next config]]
- [[_COMMUNITY_postcss.config.js|postcss.config.js]]
- [[_COMMUNITY_tailwind config|tailwind config]]
- [[_COMMUNITY_index|index]]
- [[_COMMUNITY_index|index]]

## God Nodes (most connected - your core abstractions)
1. `CrmController` - 17 edges
2. `CrmService` - 17 edges
3. `SalesService` - 17 edges
4. `SalesController` - 16 edges
5. `Levithon Labs Logo (logowhite.png)` - 11 edges
6. `PdfService` - 10 edges
7. `Levithon Labs Circular Logo` - 10 edges
8. `Levithonlabs Corporate Logo` - 10 edges
9. `TenantController` - 9 edges
10. `TenantService` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Authentication Page Branding Context` --conceptually_related_to--> `Login Page`  [INFERRED]
  apps/web/public/logowhite.png → apps/web/src/app/login/page.tsx
- `Authentication Page Branding Context` --conceptually_related_to--> `Signup Page`  [INFERRED]
  apps/web/public/logowhite.png → apps/web/src/app/signup/page.tsx
- `Authentication Page Branding Context` --conceptually_related_to--> `Forgot Password Page`  [INFERRED]
  apps/web/public/logowhite.png → apps/web/src/app/forgot-password/page.tsx
- `Authentication Page Branding Context` --conceptually_related_to--> `Reset Password Page`  [INFERRED]
  apps/web/public/logowhite.png → apps/web/src/app/reset-password/page.tsx
- `handleSignOut()` --calls--> `clearSession()`  [INFERRED]
  apps\web\src\app\dashboard\layout.tsx → apps\web\src\lib\auth.ts

## Communities

### Community 0 - ".getCustomerTimeline"
Cohesion: 0.06
Nodes (4): CrmController, CrmService, validatePan(), PrismaService

### Community 1 - "generateIrdVerificationHash"
Cohesion: 0.06
Nodes (5): convertADToBS(), generateIrdVerificationHash(), getFiscalYear(), SalesController, SalesService

### Community 2 - "Brand Color Palette (Red"
Cohesion: 0.14
Nodes (22): Forgot Password Page, Login Page, Authentication Page Branding Context, Brand Color Palette (Red and Charcoal Gray), Brand Dark Gray, Brand Red, Low-Poly Dragon Emblem, Dark Gray Geometric Base (+14 more)

### Community 3 - ".generateQuotationPdf"
Cohesion: 0.23
Nodes (2): IntegrationController, PdfService

### Community 4 - "handleConvertToInvoice"
Cohesion: 0.16
Nodes (15): fetchInvoices(), fetchQuotations(), fetchReports(), fetchTaxes(), handleAddItem(), handleAddTax(), handleConvertToInvoice(), handleCreateReport() (+7 more)

### Community 5 - "getSessionTenant"
Cohesion: 0.15
Nodes (9): clearSession(), getSessionToken(), getSessionUser(), hasPermission(), hasRole(), isAuthenticated(), saveSession(), handleSignOut() (+1 more)

### Community 6 - ".sendPasswordResetEmail"
Cohesion: 0.17
Nodes (2): AuthService, MailService

### Community 7 - "EbillingController"
Cohesion: 0.15
Nodes (3): EbillingController, EbillingService, MockIrdClient

### Community 8 - "toggleCustomerActiveState"
Cohesion: 0.22
Nodes (9): fetchCustomers(), fetchLeads(), handleAddActivity(), handleAddContact(), handleAddCustomer(), handleAddLead(), handleMoveStatus(), handleSaveEdit() (+1 more)

### Community 9 - "Circular Badge Emblem Layout"
Cohesion: 0.23
Nodes (12): Circular Badge Emblem Layout, Dashboard Sidebar Branding, Double-Ring Border, Low-Poly Dragon Head Icon, Innovation Private Limited, Leviathan Naming Theme, Levithon Labs Circular Logo, LEVITHONLABS Wordmark (+4 more)

### Community 10 - "Levithonlabs Innovation Private Limited"
Cohesion: 0.21
Nodes (12): Black Background, Bold Sans-Serif Typography, Brand Identity Asset, Circular Badge Emblem, Levithonlabs Corporate Logo, Dark Grey-Blue Metallic Tone, Geometric Dragon Icon, Levithonlabs (+4 more)

### Community 11 - ".toggleUserActive"
Cohesion: 0.2
Nodes (1): TenantController

### Community 12 - ".toggleUserActive"
Cohesion: 0.2
Nodes (1): TenantService

### Community 13 - ".getDashboardStats"
Cohesion: 0.22
Nodes (1): UtilityService

### Community 14 - "CreateCustomerContactDto"
Cohesion: 0.25
Nodes (7): CreateCustomerContactDto, CreateCustomerDto, CreateLeadActivityDto, CreateLeadDto, DeactivateCustomerDto, UpdateCustomerDto, UpdateLeadStatusDto

### Community 15 - ".getNotifications"
Cohesion: 0.25
Nodes (1): UtilityController

### Community 16 - ".resetPassword"
Cohesion: 0.29
Nodes (1): AuthController

### Community 17 - "CreateCreditNoteDto"
Cohesion: 0.29
Nodes (6): CreateCreditNoteDto, CreateInvoiceDto, CreatePaymentDto, CreateQuotationDto, CreateTaxDto, InvoiceItemInputDto

### Community 18 - ".canActivate"
Cohesion: 0.5
Nodes (1): AuthGuard

### Community 19 - "handleDownloadReceipt"
Cohesion: 0.5
Nodes (2): fetchData(), handleLogPayment()

### Community 20 - "PermissionsGuard"
Cohesion: 0.5
Nodes (1): PermissionsGuard

### Community 21 - ".constructor"
Cohesion: 0.5
Nodes (1): RolesGuard

### Community 22 - "AuditInterceptor"
Cohesion: 0.5
Nodes (1): AuditInterceptor

### Community 23 - "TenantMiddleware"
Cohesion: 0.5
Nodes (1): TenantMiddleware

### Community 24 - "CreateTenantUserDto"
Cohesion: 0.5
Nodes (3): CreateTenantUserDto, UpdateProfileDto, UpdateSettingDto

### Community 25 - "handleToggleActive"
Cohesion: 0.83
Nodes (3): fetchUsers(), handleCreateUser(), handleToggleActive()

### Community 26 - "AppModule"
Cohesion: 0.67
Nodes (1): AppModule

### Community 27 - "bootstrap"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "RequirePermissions"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Roles"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "AuthModule"
Cohesion: 1.0
Nodes (1): AuthModule

### Community 31 - "LoginDto"
Cohesion: 1.0
Nodes (1): LoginDto

### Community 32 - "RegisterDto"
Cohesion: 1.0
Nodes (1): RegisterDto

### Community 33 - "CrmModule"
Cohesion: 1.0
Nodes (1): CrmModule

### Community 34 - "IntegrationModule"
Cohesion: 1.0
Nodes (1): IntegrationModule

### Community 35 - "PrismaModule"
Cohesion: 1.0
Nodes (1): PrismaModule

### Community 36 - "SalesModule"
Cohesion: 1.0
Nodes (1): SalesModule

### Community 37 - "TenantModule"
Cohesion: 1.0
Nodes (1): TenantModule

### Community 38 - "UtilityModule"
Cohesion: 1.0
Nodes (1): UtilityModule

### Community 39 - "RootLayout"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "RootPage"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "fetchDashboard"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "fetchLogs"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "SettingsPage"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "request"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "main"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "next-env d"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "next config"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "postcss.config.js"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "tailwind config"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "index"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "index"
Cohesion: 1.0
Nodes (0): 

## Ambiguous Edges - Review These
- `Levithon Labs Logo (logowhite.png)` → `Authentication Page Branding Context`  [AMBIGUOUS]
  apps/web/public/logowhite.png · relation: conceptually_related_to
- `Geometric Dragon Icon` → `Stylized L Monogram`  [AMBIGUOUS]
  images/logopng.png · relation: conceptually_related_to
- `LevithonLabs Logo` → `Light Background Usage Context`  [AMBIGUOUS]
  images/logowhite.png · relation: conceptually_related_to

## Knowledge Gaps
- **38 isolated node(s):** `AuthModule`, `LoginDto`, `RegisterDto`, `CrmModule`, `CreateCustomerDto` (+33 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `bootstrap`** (2 nodes): `main.ts`, `bootstrap()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `RequirePermissions`** (2 nodes): `permissions.decorator.ts`, `RequirePermissions()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Roles`** (2 nodes): `roles.decorator.ts`, `Roles()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AuthModule`** (2 nodes): `auth.module.ts`, `AuthModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `LoginDto`** (2 nodes): `login.dto.ts`, `LoginDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `RegisterDto`** (2 nodes): `register.dto.ts`, `RegisterDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CrmModule`** (2 nodes): `crm.module.ts`, `CrmModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `IntegrationModule`** (2 nodes): `integration.module.ts`, `IntegrationModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PrismaModule`** (2 nodes): `prisma.module.ts`, `PrismaModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SalesModule`** (2 nodes): `sales.module.ts`, `SalesModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TenantModule`** (2 nodes): `tenant.module.ts`, `TenantModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `UtilityModule`** (2 nodes): `utility.module.ts`, `UtilityModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `RootLayout`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `RootPage`** (2 nodes): `page.tsx`, `RootPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `fetchDashboard`** (2 nodes): `page.tsx`, `fetchDashboard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `fetchLogs`** (2 nodes): `page.tsx`, `fetchLogs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SettingsPage`** (2 nodes): `page.tsx`, `SettingsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `request`** (2 nodes): `request()`, `api.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `main`** (2 nodes): `seed.ts`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `next-env d`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `next config`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `postcss.config.js`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `tailwind config`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `index`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `index`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Levithon Labs Logo (logowhite.png)` and `Authentication Page Branding Context`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Geometric Dragon Icon` and `Stylized L Monogram`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `LevithonLabs Logo` and `Light Background Usage Context`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `convertADToBS()` connect `generateIrdVerificationHash` to `.generateQuotationPdf`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `AuthModule`, `LoginDto`, `RegisterDto` to the rest of the system?**
  _38 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.getCustomerTimeline` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `generateIrdVerificationHash` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._