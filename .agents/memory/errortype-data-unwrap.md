---
name: ErrorType error message access pattern
description: How to extract the server error message from orval-generated ErrorType
---

The custom fetch in this project throws errors as:
```ts
throw Object.assign(new Error(data?.error ?? response.statusText), { status, data });
```

The TypeScript type is `ErrorType<T>` (e.g. `ErrorType<ErrorResponse>`), but `.error` is NOT a direct property on the type.

**Correct pattern:** `(err as any).data?.error || "fallback"`

**Why:** The `.error` string lives inside `.data` (which is the raw response body). The type definition doesn't expose `.error` directly, so accessing `err.error` causes TS2339.

**How to apply:** In all `onError` callbacks from useMutation or useQuery, replace `err.error` with `(err as any).data?.error`.
