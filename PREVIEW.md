# Dohkar Client - Project Context

## Project Overview

**Dohkar** is a real estate platform built with **Next.js 16** and **React 19**, targeting properties in the Caucasus region (Chechnya, Ingushetia). The client application provides a modern, responsive UI with features including property search, listings, user authentication, favorites, messaging, and regional customization.

### Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui (Radix UI primitives) |
| **State Management** | Zustand, TanStack Query |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **Testing** | Vitest |
| **Linting** | ESLint 9 + Prettier |
| **Deployment** | Vercel, Docker |

### Architecture

- **App Router** (`/app`) - File-based routing with server components
- **Component Library** (`/src/components`) - Reusable UI components including shadcn/ui
- **Service Layer** (`/src/services`) - Typed API services for backend communication
- **API Client** (`/src/lib/api-client.ts`) - Custom fetch wrapper with token refresh, retry logic, request cancellation
- **Type Generation** - OpenAPI types auto-generated from backend (`/src/types/api.ts`)

## Building and Running

### Prerequisites

- Node.js 22+
- npm

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Key environment variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:4000`)
- `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` - Yandex Maps API key

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run start
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run tscheck` | Type check with TypeScript |
| `npm run test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run sync:api` | Sync and generate API types from backend |
| `npm run generate:api-types` | Generate API types only |
| `npm run validate:openapi` | Validate OpenAPI spec |

## Development Conventions

### Code Style

- **TypeScript**: Strict mode enabled, no implicit `any`
- **ESLint**: Next.js core-web-vitals + TypeScript rules
- **Prettier**: Code formatting (run before commit)
- **Imports**: Use path aliases (`@/`, `@/components/`, `@/lib/`, etc.)

### Path Aliases

```json
{
  "@/*": "./src/*",
  "@/components/*": "./src/components/*",
  "@/lib/*": "./src/lib/*",
  "@/hooks/*": "./src/hooks/*",
  "@/types/*": "./src/types/*",
  "@/services/*": "./src/services/*",
  "@/constants/*": "./src/constants/*",
  "@/app/*": "./app/*"
}
```

### Testing

- **Framework**: Vitest
- **Location**: `src/__tests__/` and `*.test.ts` files
- **Environment**: Node.js

### API Integration

The project uses auto-generated TypeScript types from the backend OpenAPI spec:

```bash
# Sync API types (run when backend changes)
npm run sync:api
```

Generated types are in `src/types/api.ts` (do not edit manually).

Use typed services in `src/services/` for API calls:
- `auth-typed.service.ts` - Authentication
- `property-typed.service.ts` - Properties
- `users.service.ts` - User management
- `favorites.service.ts` - Favorites
- `chats.service.ts` - Messaging

### Component Patterns

- **shadcn/ui**: UI components in `src/components/ui/`
- **Feature components**: In `src/components/features/`
- **Layout components**: In `src/components/layout/`
- **Theme**: Dark/light mode via `next-themes`

### State Management

- **Zustand**: Global state stores in `src/stores/`
- **TanStack Query**: Server state caching and synchronization

### Key Features

- **Regional support**: Auto-detects user region (Chechnya/Ingushetia) via IP
- **Authentication**: JWT with refresh token rotation (HttpOnly cookies)
- **Property search**: Advanced filtering, maps integration
- **Real-time**: Socket.io for chat/messaging
- **Responsive**: Mobile-first design with Tailwind CSS

## Project Structure

```
client/
├── app/                    # Next.js App Router pages
│   ├── (home)/            # Home page group
│   ├── [region]/          # Dynamic region routes
│   ├── property/          # Property details
│   ├── search/            # Search results
│   ├── auth/              # Login/Register
│   ├── dashboard/         # User dashboard
│   └── ...
├── src/
│   ├── __tests__/         # Test files
│   ├── components/        # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── features/      # Feature-specific components
│   │   └── layout/        # Layout components
│   ├── config/            # App configuration
│   ├── constants/         # Constants and config values
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and helpers
│   ├── services/          # API service layer
│   ├── stores/            # Zustand stores
│   ├── styles/            # Global styles
│   └── types/             # TypeScript types
│       └── api.ts         # Auto-generated API types
├── public/                # Static assets
├── scripts/               # Build/sync scripts
│   ├── sync-api.js        # API type sync script
│   └── validate-openapi.js
└── package.json
```

## Docker

```bash
docker build -t dohkar-client .
docker run -p 3000:3000 dohkar-client
```

## Vercel Deployment

Configured via `vercel.json`. Deploy automatically on git push to main branch.

## Key Modules and Patterns

### Zustand Stores (`src/stores/`)

Global state management using Zustand:

| Store | Purpose |
|-------|---------|
| `auth.store.ts` | Authentication state, login/register/logout, silent token refresh |
| `favorites.store.ts` | User favorites management |
| `property.store.ts` | Property state and filters |
| `ui.store.ts` | UI state (modals, themes, etc.) |

**Pattern example** - Auth store with automatic initialization:
```typescript
import { useAuthStore } from "@/stores/auth.store";

// Store auto-initializes on module load
const { user, isAuthenticated, login, logout } = useAuthStore();
```

### Custom Hooks (`src/hooks/`)

Reusable React hooks for common functionality:

| Hook | Purpose |
|------|---------|
| `use-auth.ts` | Auth state and actions wrapper |
| `use-debounce.ts` | Debounce values for search |
| `use-local-storage.ts` | Persist state to localStorage |
| `use-user-region.ts` | Get/set user region |
| `use-favorites.ts` | Favorites management |
| `use-properties.ts` | Property fetching and caching |
| `use-search-history.ts` | Search history persistence |
| `use-view-history.ts` | Property view tracking |
| `use-socket.ts` | Socket.io connection |
| `use-optimistic-delete.ts` | Optimistic UI updates |
| `use-click-outside.ts` | Detect clicks outside element |
| `use-media-query.ts` | Responsive breakpoints |

### API Client (`src/lib/api-client.ts`)

Custom fetch wrapper with:
- **Automatic token refresh** - Handles 401 responses with refresh token rotation
- **Retry logic** - Up to 2 retries for network errors with exponential backoff
- **Request cancellation** - AbortController integration for cancelling requests
- **HttpOnly cookies** - Secure refresh token handling via `credentials: "include"`

```typescript
import { apiClient } from "@/lib/api-client";

// GET request with auto-retry
const data = await apiClient.get<Property[]>("/api/properties");

// POST with typed response
const result = await apiClient.post<Property>("/api/properties", propertyData);

// Cancelable request
apiClient.get<Property>("/api/properties/123", {}, "property-123");
apiClient.cancelRequest("property-123"); // Cancel by key
```

### Routes and Endpoints (`src/constants/routes.ts`)

Centralized route and API endpoint definitions:

```typescript
import { ROUTES, API_ENDPOINTS } from "@/constants";

// Navigation
router.push(ROUTES.property("123", "luxury-apartment")); // /property/123-luxury-apartment
router.push(ROUTES.profile(userId));

// API calls
await apiClient.get(API_ENDPOINTS.properties.list);
await apiClient.post(API_ENDPOINTS.favorites.add(propertyId));
```

### Utility Functions

**`cn()` - Class name merger** (`src/lib/utils/cn.ts`):
```typescript
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class", className)} />
```

**Region utilities** (`src/lib/regions.ts`):
```typescript
import { getRegionNameById, registerRegionMapping } from "@/lib/regions";

registerRegionMapping(uuid, "Chechnya");
const region = getRegionNameById(uuid); // "Chechnya"
```

### Feature Components (`src/components/features/`)

Key feature components:

| Component | Purpose |
|-----------|---------|
| `property-card.tsx` | Property listing card with image, price, details |
| `property-filters.tsx` | Search filters (price, type, rooms, etc.) |
| `yandex-map.tsx` | Yandex Maps integration for property locations |
| `hero-search.tsx` | Main search hero section |
| `categories.tsx` | Property category selector |
| `chats/` | Messaging components |
| `auth-modal/` | Login/register modal with OAuth |
| `property-form/` | Property creation/editing form |

### OAuth Integration

Support for multiple OAuth providers with popup handling:

```typescript
import { OAuthPopupButton } from "@/components/features/OAuthPopupButton";

<OAuthPopupButton 
  provider="google" 
  onSuccess={(user) => console.log("Logged in:", user)}
/>
```

Providers: Google, Yandex, VK

### Silent Auth Scheduler

Automatic token refresh mechanism:
- Schedules periodic refresh attempts
- Handles token expiration gracefully
- Dispatches `auth:session-expired` event on failure

### Socket.io Integration

Real-time messaging via Socket.io:

```typescript
import { useSocket } from "@/hooks/use-socket";

const { socket, connected, sendMessage } = useSocket();
```

## Environment Variables

Full list of environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000` |
| `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` | Yandex Maps API key (client-side) | - |
| `YANDEX_GEOCODER_API_KEY` | Yandex Geocoder API key (server-side, optional) | - |
| `NODE_ENV` | Environment mode | `development` |

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch
```

### Test File Location

- Unit tests: `src/__tests__/`
- Component tests: `*.test.ts` alongside components

### Vitest Configuration

```typescript
// vitest.config.ts
{
  test: {
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}
```

## Troubleshooting

### API Type Errors After Sync

When backend API changes:
```bash
# 1. Sync latest types
npm run sync:api

# 2. Check for type errors
npm run tscheck

# 3. Fix code to match new contract
# Edit affected files based on error messages
```

### 401 Authentication Errors

The API client handles 401 automatically:
1. Attempts token refresh via `/api/auth/refresh`
2. Retries original request with new token
3. On failure, redirects to login and clears state

If stuck in logout loop:
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend refresh endpoint is working
- Clear browser cookies and re-login

### Region Detection Issues

Middleware detects region via:
1. Vercel geo headers (`x-vercel-ip-country-region`)
2. IP-API lookup (fallback)
3. User cookie preference

To reset region: clear `user_region` cookie

## Additional Resources

| Document | Description |
|----------|-------------|
| `OPENAPI_SETUP.md` | OpenAPI sync and type generation |
| `OPENAPI_TYPES.md` | Working with generated API types |
| `API_TYPES_SETUP.md` | API type utilities and examples |
| `scripts/README.md` | Build and sync scripts documentation |
