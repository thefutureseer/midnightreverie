---
name: TanStack Query v5 queryKey requirement
description: queryKey must be passed alongside enabled in generated hook query options
---

In this project, generated hooks from @workspace/api-client-react use TanStack Query v5.
When passing `enabled` inside the `query:` option object, you MUST also pass `queryKey`.
Use the generated helper: e.g. `queryKey: getGetMeQueryKey()`, `queryKey: getGetVenueQueryKey(venueId)`.

**Why:** TanStack Query v5 changed `queryKey` from optional to required when `enabled` is specified in UseQueryOptions. The generated types reflect this. Omitting it causes TS2741.

**How to apply:** Any time you write `query: { enabled: ... }`, add `queryKey: get<HookName>QueryKey(args)` alongside it. The key helpers follow the naming convention `get<OperationId>QueryKey(pathParams?)`.
