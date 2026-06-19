---
type: community
cohesion: 0.17
members: 16
---

# .sendPasswordResetEmail

**Cohesion:** 0.17 - loosely connected
**Members:** 16 nodes

## Members
- [[.constructor()_6]] - code - apps\api\src\modules\auth\auth.service.ts
- [[.constructor()_12]] - code - apps\api\src\modules\integration\mail.service.ts
- [[.forgotPassword()_1]] - code - apps\api\src\modules\auth\auth.service.ts
- [[.initializeTransporter()]] - code - apps\api\src\modules\integration\mail.service.ts
- [[.login()_1]] - code - apps\api\src\modules\auth\auth.service.ts
- [[.register()_1]] - code - apps\api\src\modules\auth\auth.service.ts
- [[.resetPassword()_1]] - code - apps\api\src\modules\auth\auth.service.ts
- [[.sendInvoiceEmail()]] - code - apps\api\src\modules\integration\mail.service.ts
- [[.sendMail()]] - code - apps\api\src\modules\integration\mail.service.ts
- [[.sendPasswordResetEmail()]] - code - apps\api\src\modules\integration\mail.service.ts
- [[.sendQuotationEmail()]] - code - apps\api\src\modules\integration\mail.service.ts
- [[.sendUserInvitationEmail()]] - code - apps\api\src\modules\integration\mail.service.ts
- [[AuthService]] - code - apps\api\src\modules\auth\auth.service.ts
- [[MailService]] - code - apps\api\src\modules\integration\mail.service.ts
- [[auth.service.ts]] - code - apps\api\src\modules\auth\auth.service.ts
- [[mail.service.ts]] - code - apps\api\src\modules\integration\mail.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/.sendPasswordResetEmail
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_.generateQuotationPdf]]

## Top bridge nodes
- [[.sendInvoiceEmail()]] - degree 3, connects to 1 community
- [[.sendQuotationEmail()]] - degree 3, connects to 1 community