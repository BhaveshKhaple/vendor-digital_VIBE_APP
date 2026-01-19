# replit.md

## Overview

Micro-Vendor Ledger is a mobile-first ledger application designed for micro-vendors to track sales, expenses, and customer credit. The primary focus is on **offline-first data persistence** with speed and reliability in fast-paced market environments. The app uses local SQLite storage to function without internet connectivity.

The application follows a traditional ledger book aesthetic with earthy tones, generous spacing, and high-contrast typography. Core functionality includes:
- Quick transaction entry (income/expense)
- Product catalog management
- Customer credit tracking (ledger)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 with native stack and bottom tabs
- **State Management**: TanStack React Query for server state, local React state for UI
- **Animations**: React Native Reanimated for fluid micro-interactions
- **Styling**: StyleSheet-based with a centralized theme system (`client/constants/theme.ts`)

The frontend uses a tab-based navigation structure with three main sections:
1. **Sales** - Transaction entry with product quick-tap and manual keypad
2. **Ledger** - Customer credit tracking
3. **Inventory** - Product catalog management

Path aliases are configured: `@/` maps to `./client/` and `@shared/` maps to `./shared/`.

### Backend Architecture
- **Server**: Express.js (v5) running on Node.js
- **Purpose**: Primarily serves as a landing page and potential future API endpoint
- **Current State**: Minimal implementation with CORS handling for Replit domains

The backend is intentionally lightweight since the app prioritizes offline-first local storage.

### Data Storage

**Local Storage (Primary)**:
- **SQLite** via `expo-sqlite` for offline-first persistence
- Three core tables: `products`, `transactions`, `customers`
- Repository pattern implementation in `client/lib/repositories/`
- WAL mode enabled for better performance

**Server Database (Secondary)**:
- **PostgreSQL** with Drizzle ORM configured for potential cloud sync
- Schema defined in `shared/schema.ts`
- Currently only has a `users` table for future authentication

### Key Design Patterns

1. **Repository Pattern**: All database operations go through repository classes (`ProductRepository`, `TransactionRepository`, `CustomerRepository`)
2. **Offline-First**: Local SQLite is the source of truth; no network required for core functionality
3. **Component Composition**: Reusable UI components with consistent theming
4. **Custom Hooks**: Business logic encapsulated in hooks like `useSalesData`, `useTheme`

### Theming System
- Light/dark mode support with automatic system detection
- Centralized color tokens, spacing, and typography in `client/constants/theme.ts`
- Warm amber/orange primary color with earthy tones

## External Dependencies

### Core Libraries
| Package | Purpose |
|---------|---------|
| `expo` | React Native development platform |
| `expo-sqlite` | Local SQLite database |
| `@react-navigation/*` | Navigation infrastructure |
| `react-native-reanimated` | Smooth animations |
| `@tanstack/react-query` | Async state management |

### Backend Dependencies
| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `drizzle-orm` | PostgreSQL ORM (future cloud sync) |
| `pg` | PostgreSQL driver |

### Database
- **Local**: SQLite (embedded, no external service)
- **Server**: PostgreSQL via `DATABASE_URL` environment variable (Drizzle configured)

### Build Tools
- `tsx` for TypeScript execution
- `esbuild` for server bundling
- Babel with module resolver for path aliases