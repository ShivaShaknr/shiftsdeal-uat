# Custom Logger Utility

A development-only logging utility that automatically disables all logs in production.

## Location

`lib/utils/logger.ts`

## Features

- ✅ Only outputs in development mode (NODE_ENV !== 'production')
- ✅ Completely silent in production
- ✅ Mirrors native console API
- ✅ TypeScript support
- ✅ Zero dependencies
- ✅ Easy to import and use

## Usage

### Import the logger

```typescript
import logger from "@/lib/utils/logger";
```

### Available Methods

All methods accept any number of arguments, just like native console methods:

```typescript
// Standard logging
logger.log("User logged in", userData);
logger.log("Multiple", "arguments", "supported", { data: "object" });

// Informational messages
logger.info("API call successful", response);

// Warnings
logger.warn("Deprecated API used", apiName);

// Errors
logger.error("Failed to fetch data", error);
```

## Migration Guide

### Before (using native console)

```typescript
console.log("Auth state change:", event);
console.error("Error fetching user:", error);
console.warn("Session timeout approaching");
console.info("User preferences loaded");
```

### After (using logger)

```typescript
import logger from "@/lib/utils/logger";

logger.log("Auth state change:", event);
logger.error("Error fetching user:", error);
logger.warn("Session timeout approaching");
logger.info("User preferences loaded");
```

## Benefits

### 1. Automatic Production Cleanup

No need to manually remove console.logs before deploying - they're automatically disabled in production.

### 2. Performance

Zero overhead in production since all methods are no-ops.

### 3. Security

Prevents accidental exposure of sensitive data in production logs.

### 4. Consistency

Single import across the entire codebase for all logging needs.

## Example Implementation

See `lib/auth/AuthContext.tsx` for real-world examples of logger usage throughout the authentication flow.

### Example from AuthContext:

```typescript
import logger from "@/lib/utils/logger";

// Log auth state changes
logger.log(
  "Auth state change:",
  event,
  session ? "session exists" : "no session",
);

// Log errors
logger.error("Error fetching user role:", error);

// Log warnings
logger.warn("Auth initialization timed out");

// Log info
logger.info("Tab became visible, checking session validity");
```

## Environment Detection

The logger checks `process.env.NODE_ENV` to determine the environment:

- **Development**: All logs output normally
- **Production**: All logs are suppressed (no-op)

## When to Use

✅ **Use logger for:**

- Debugging during development
- Tracking application flow
- Error reporting during development
- State change monitoring

❌ **Don't use logger for:**

- User-facing messages (use proper UI feedback)
- Critical production monitoring (use proper logging service)
- Analytics (use dedicated analytics tools)

## Testing

In development (NODE_ENV !== 'production'):

```bash
npm run dev
# All logger calls will output to console
```

In production (NODE_ENV === 'production'):

```bash
npm run build
npm start
# All logger calls are silent
```

## Quick Replace All

To migrate existing console calls in a file:

1. Add import: `import logger from '@/lib/utils/logger';`
2. Find and replace:
   - `console.log(` → `logger.log(`
   - `console.info(` → `logger.info(`
   - `console.warn(` → `logger.warn(`
   - `console.error(` → `logger.error(`
