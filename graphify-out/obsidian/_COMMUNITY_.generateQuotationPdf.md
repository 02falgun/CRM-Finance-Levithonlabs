---
type: community
cohesion: 0.23
members: 20
---

# .generateQuotationPdf

**Cohesion:** 0.23 - loosely connected
**Members:** 20 nodes

## Members
- [[.buildBuffer()]] - code - apps\api\src\modules\integration\pdf.service.ts
- [[.constructor()_11]] - code - apps\api\src\modules\integration\integration.controller.ts
- [[.downloadInvoicePdf()]] - code - apps\api\src\modules\integration\integration.controller.ts
- [[.downloadQuotationPdf()]] - code - apps\api\src\modules\integration\integration.controller.ts
- [[.downloadReceiptPdf()]] - code - apps\api\src\modules\integration\integration.controller.ts
- [[.downloadReportPdf()]] - code - apps\api\src\modules\integration\integration.controller.ts
- [[.drawHeaderLogo()]] - code - apps\api\src\modules\integration\pdf.service.ts
- [[.drawOfficialStamp()]] - code - apps\api\src\modules\integration\pdf.service.ts
- [[.drawPanBox()]] - code - apps\api\src\modules\integration\pdf.service.ts
- [[.drawSignature()]] - code - apps\api\src\modules\integration\pdf.service.ts
- [[.emailInvoice()]] - code - apps\api\src\modules\integration\integration.controller.ts
- [[.emailQuotation()]] - code - apps\api\src\modules\integration\integration.controller.ts
- [[.generateInvoicePdf()]] - code - apps\api\src\modules\integration\pdf.service.ts
- [[.generateQuotationPdf()]] - code - apps\api\src\modules\integration\pdf.service.ts
- [[.generateReceiptPdf()]] - code - apps\api\src\modules\integration\pdf.service.ts
- [[.generateReportPdf()]] - code - apps\api\src\modules\integration\pdf.service.ts
- [[IntegrationController]] - code - apps\api\src\modules\integration\integration.controller.ts
- [[PdfService]] - code - apps\api\src\modules\integration\pdf.service.ts
- [[integration.controller.ts]] - code - apps\api\src\modules\integration\integration.controller.ts
- [[pdf.service.ts]] - code - apps\api\src\modules\integration\pdf.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/.generateQuotationPdf
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_.sendPasswordResetEmail]]
- 1 edge to [[_COMMUNITY_generateIrdVerificationHash]]

## Top bridge nodes
- [[.generateInvoicePdf()]] - degree 9, connects to 1 community
- [[.emailInvoice()]] - degree 3, connects to 1 community
- [[.emailQuotation()]] - degree 3, connects to 1 community