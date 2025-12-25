# ESLint Phase 0 Import Restrictions

## Status

✅ **ESLint rules configured** in `.eslintrc.json` to block Phase 0 imports of forbidden modules.

⚠️ **Known Issue:** `npm run lint` (Next.js ESLint) has compatibility issues with ESLint v9. The rules file is correct and will work with direct ESLint usage.

## Rules Enforced

The following imports are **forbidden in Phase 0 code**:

- `@/app/admin/*`
- `@/app/branch-owner/*`
- `@/app/pilot/*`
- `@/app/finance/*`
- `@/app/metrics/*`
- `@/api/admin/*`
- `@/api/branch-owner/*`
- `@/api/pilot/*`
- `@/api/finance/*`
- `@/api/metrics/*`

**Exception:** Files inside these directories can import from each other (for Phase 1+).

## Usage

### Direct ESLint (Recommended for CI)

```bash
npx eslint . --ext .ts,.tsx
```

### Next.js Lint (Has compatibility issues)

```bash
npm run lint
```

**Note:** Next.js lint may show compatibility warnings but the rules are still defined correctly.

## Verification

To test that the rules work, try importing a forbidden module in Phase 0 code:

```typescript
// This should trigger an ESLint error:
import { something } from '@/app/admin/users';
```

**Expected:** ESLint error with message: "❌ Forbidden in Phase 0. This module is disabled. See RULES.md."

## CI Integration

For CI/CD, use direct ESLint:

```yaml
# Example GitHub Actions
- name: Run ESLint
  run: npx eslint . --ext .ts,.tsx --max-warnings=0
```

## Future

When Next.js fully supports ESLint v9 flat config, we can migrate to `eslint.config.mjs` format.

