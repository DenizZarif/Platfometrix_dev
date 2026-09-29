# Roadmap

- [x] Add category-specific implementation plan derivation with canonical tool fallback.
- [x] Add the implementation plan toggle and panel to result cards.
- [x] Pass category, answers, and profile into live and saved result cards.
- [x] Verify types, build, and BI/CRM/warehouse behavior including profile context.
- [x] Add supplied market-adoption data to all tool catalogs.
- [x] Add computed best-fit profiles for BI, CRM, and warehouse tools.
- [x] Add popularity and best-fit details to result cards and comparison.
- [x] Verify types, build, unchanged scores, and all category displays.

- [x] Migration estimate: optional "what do you use today" dropdown per category + computed migration section on result cards
- [x] Exit-risk score: always-visible lock-in panel on every result card (src/lib/exitRisk.ts + ResultCard toggle), verified across BI/CRM/warehouse
- [x] Vendor negotiation checklist: factorCodes parallel array in exitRisk.ts (additive), negotiationChecklist.ts (NEGOTIATION_ASKS + universal termination tip, dedup), ResultCard "Show negotiation checklist" toggle + "Before you sign" panel right after exit-risk panel; zero-factor tools show only the universal tip. Verified in browser across BI/CRM/warehouse; typecheck and build clean.
