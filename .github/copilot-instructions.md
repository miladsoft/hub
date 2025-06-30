````instructions
# Grants Platform - Decentralized Bitcoin Crowdfunding Platform

## Project Overview
Grants Platform is a decentralized Bitcoin crowdfunding platform that leverages Nostr protocol for project discovery and Bitcoin for funding. This React application provides a modern, responsive interface for exploring, creating, and funding projects on the Bitcoin network.

## Key Features
- **Real-time Project Data**: Aggregates data from Angor Indexer API and Nostr Network
- **Multi-Source Integration**: Combines data from multiple relays and APIs
- **Progress Tracking**: Real-time loading progress with comprehensive error handling
- **Parallel Data Fetching**: Optimized performance with Promise.all and retry mechanisms
- **Comprehensive Project Details**: Stats, investments, profiles, FAQ, media, and team members

## Technology Stack

### Core Technologies
- **React 19.x**: Stable version with hooks, concurrent rendering, and improved performance
- **TypeScript**: For type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **TailwindCSS 4.x**: Utility-first CSS framework for styling
- **shadcn/ui**: Unstyled, accessible UI components built with Radix UI and Tailwind
- **Nostrify**: Nostr protocol framework for Deno and web
- **React Router**: For client-side routing with BrowserRouter and ScrollToTop functionality
- **TanStack Query**: For data fetching, caching, and state management
- **Bitcoin Integration**: @scure/btc-signer for Bitcoin operations

### Data Sources
- **Angor Indexer API**: `https://explorer.angor.io/api/query/Angor/`
- **Nostr Relay Pool**: Multiple relays for decentralized data
  - `wss://relay.damus.io`
  - `wss://relay.primal.net`
  - `wss://nos.lol`
  - `wss://relay.angor.io`
  - `wss://relay2.angor.io`

### Key Dependencies
```json
{
  "nostrify": "^0.x.x",
  "@scure/btc-signer": "^1.x.x", 
  "react-router-dom": "^6.x.x",
  "tailwindcss": "^4.x.x",
  "@radix-ui/react-*": "Latest stable versions",
  "@tanstack/react-query": "Latest stable version"
}
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components (48+ available)
│   ├── auth/            # Authentication components (LoginArea, LoginDialog, etc.)
│   └── layout/          # Layout components (AngorLayout, Sidebar)
├── contexts/            # React contexts (AppContext)
├── hooks/               # Custom hooks
│   ├── useNostr.ts      # Core Nostr protocol integration
│   ├── useAuthor.ts     # Fetch user profile data by pubkey
│   ├── useCurrentUser.ts # Get currently logged-in user
│   ├── useNostrPublish.ts # Publish events to Nostr
│   ├── useUploadFile.ts # Upload files via Blossom servers
│   ├── useAppContext.ts # Access global app configuration
│   ├── useTheme.ts      # Theme management
│   ├── useToast.ts      # Toast notifications
│   ├── useLocalStorage.ts # Persistent local storage
│   ├── useLoggedInAccounts.ts # Manage multiple accounts
│   ├── useLoginActions.ts # Authentication actions
│   └── useIsMobile.tsx  # Responsive design helper
├── pages/               # Page components (HomePage, ExplorePage, ProfilePage, etc.)
├── services/            # Business logic services
├── types/               # TypeScript type definitions
├── lib/                 # Utility functions and shared logic
├── test/                # Testing utilities including TestApp component
└── assets/             # Static assets
```

## Brand Guidelines & Design System

### Color Palette (Angor Brand)
```css
:root {
  /* Primary Angor Colors */
  --angor-orange: #f97316;      /* Primary brand color */
  --angor-orange-hover: #ea580c; /* Hover state */
  --angor-orange-light: #fed7aa; /* Light variant */
  
  /* Bitcoin Network Colors */
  --bitcoin-mainnet: #f7931a;   /* Bitcoin orange */
  --bitcoin-testnet: #00d4aa;   /* Testnet green */
  
  /* Neutral Colors */
  --text-primary: #111827;      /* Dark text */
  --text-secondary: #6b7280;    /* Secondary text */
  --background: #ffffff;        /* Light background */
  --surface: #f9fafb;          /* Surface color */
  --border: #e5e7eb;           /* Border color */
}

/* Dark mode variants */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #f9fafb;
    --text-secondary: #9ca3af;
    --background: #111827;
    --surface: #1f2937;
    --border: #374151;
  }
}
```

### Design Principles
1. **Solid Colors Only**: No gradients in buttons or primary UI elements
2. **High Contrast**: Ensure accessibility with WCAG 2.1 AA compliance
3. **Consistent Spacing**: Use Tailwind's spacing scale (4, 8, 12, 16, 24, 32px)
4. **Modern Typography**: Inter font family with appropriate weights
5. **Responsive Design**: Mobile-first approach with breakpoints at sm (640px), md (768px), lg (1024px), xl (1280px)

## Nostr Protocol Integration

### Angor-Specific Event Kinds
```typescript
export const ANGOR_EVENT_KINDS = {
  PROJECT_DETAILS: 30382,
  PROJECT_UPDATE: 30383,
  PROJECT_INVESTMENT: 30384,
  PROJECT_MILESTONE: 30385,
  PROFILE_METADATA: 0,
  PROJECT_NOTE: 1,
  PROJECT_REACTION: 7
} as const;
```

### The `useNostr` Hook
The `useNostr` hook returns an object containing a `nostr` property, with `.query()` and `.event()` methods for querying and publishing Nostr events respectively.

```typescript
import { useNostr } from '@nostrify/react';

function useCustomHook() {
  const { nostr } = useNostr();
  // ...
}
```

### Query Nostr Data with `useNostr` and TanStack Query
When querying Nostr, the best practice is to create custom hooks that combine `useNostr` and `useQuery` to get the required data.

```typescript
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

function usePosts() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['posts'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);
      const events = await nostr.query([{ kinds: [1], limit: 20 }], { signal });
      return events;
    },
  });
}
```

### Publishing Events with `useNostrPublish`
To publish events, use the `useNostrPublish` hook in this project. This hook automatically adds a "client" tag to published events.

```tsx
import { useState } from 'react';
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from '@/hooks/useNostrPublish';

export function MyComponent() {
  const [data, setData] = useState<Record<string, string>>({});
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();

  const handleSubmit = () => {
    createEvent({ kind: 1, content: data.content });
  };

  if (!user) {
    return <span>You must be logged in to use this form.</span>;
  }

  return (
    <form onSubmit={handleSubmit} disabled={!user}>
      {/* ...some input fields */}
    </form>
  );
}
```

### User Profile Data with `useAuthor`
To display profile data for a user by their Nostr pubkey, use the `useAuthor` hook.

```tsx
import type { NostrEvent, NostrMetadata } from '@nostrify/nostrify';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';

function Post({ event }: { event: NostrEvent }) {
  const author = useAuthor(event.pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;

  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const profileImage = metadata?.picture;

  // ...render elements with this data
}
```

### Nostr Login
To enable login with Nostr, use the `LoginArea` component already included in this project.

```tsx
import { LoginArea } from "@/components/auth/LoginArea";

function MyComponent() {
  return (
    <div>
      <LoginArea className="max-w-60" />
    </div>
  );
}
```

The `LoginArea` component handles all the login-related UI and interactions, including displaying login dialogs and switching between accounts.

## Data Models & Types

### Core Project Types
```typescript
interface IndexedProject {
  projectIdentifier: string;
  details?: ProjectDetails;
  metadata?: ProjectMetadata;
  stats?: ProjectStats;
  details_created_at?: number;
  metadata_created_at?: number;
  externalIdentities?: ExternalIdentity[];
}

interface ProjectDetails {
  targetAmount: number;
  startDate: number;
  expiryDate: number;
  nostrPubKey: string;
  projectIdentifier: string;
  createdOnBlock: number;
  stages?: ProjectStage[];
}

interface ProjectMetadata {
  name: string;
  about: string;
  banner?: string;
  picture?: string;
  website?: string;
  lud16?: string; // Lightning address
}

interface ProjectStats {
  amountInvested: number;
  investorCount: number;
  completionPercentage: number;
  lastUpdated: number;
}
```

### Filter & Sort Types
```typescript
type FilterType = 'all' | 'active' | 'upcoming' | 'completed';
type SortType = 'default' | 'funding' | 'endDate' | 'investors';

interface ProjectFilters {
  search?: string;
  status?: FilterType;
  minAmount?: number;
  maxAmount?: number;
  categories?: string[];
}
```

## UI Components (shadcn/ui)

The project uses shadcn/ui components located in `@/components/ui`. These are unstyled, accessible components built with Radix UI and styled with Tailwind CSS. Available components include:

- **Accordion**: Vertically collapsing content panels
- **Alert**: Displays important messages to users
- **AlertDialog**: Modal dialog for critical actions requiring confirmation
- **Avatar**: User profile pictures with fallback support
- **Badge**: Small status descriptors for UI elements
- **Button**: Customizable button with multiple variants and sizes
- **Card**: Container with header, content, and footer sections
- **Dialog**: Modal window overlay
- **Form**: Form validation and submission handling
- **Input**: Text input field
- **Select**: Dropdown selection component
- **Skeleton**: Loading placeholder
- **Table**: Data table with headers and rows
- **Tabs**: Tabbed interface component
- **Toast**: Toast notification component

### Button Component Variants
```typescript
interface ButtonVariants {
  // Primary Angor brand button
  primary: 'bg-angor-orange hover:bg-angor-orange-hover text-white';
  
  // Secondary outline button  
  secondary: 'border-angor-orange text-angor-orange hover:bg-angor-orange hover:text-white';
  
  // Danger/warning actions
  destructive: 'bg-red-600 hover:bg-red-700 text-white';
  
  // Ghost/minimal style
  ghost: 'hover:bg-angor-orange/10 text-angor-orange';
}
```

## Core Services & Data Layer

### 1. Nostr Relay Service
**File**: `src/services/nostrRelay.ts`

```typescript
interface NostrRelayService {
  // Connection management
  connect(relays: string[]): Promise<void>;
  disconnect(): void;
  
  // Project data subscription
  subscribeToProjects(): Observable<ProjectEvent>;
  subscribeToProjectUpdates(projectId: string): Observable<ProjectUpdate>;
  
  // Profile data subscription  
  subscribeToProfiles(): Observable<ProfileEvent>;
  
  // Publishing
  publishProject(project: ProjectData): Promise<void>;
  publishUpdate(projectId: string, update: UpdateData): Promise<void>;
}
```

### 2. Bitcoin Integration Service
**File**: `src/services/bitcoinService.ts`

```typescript
interface BitcoinService {
  // Network detection
  getCurrentNetwork(): 'mainnet' | 'testnet';
  
  // Address utilities
  validateAddress(address: string): boolean;
  generateMultisigAddress(pubkeys: string[], threshold: number): string;
  
  // Transaction utilities
  estimateFees(): Promise<FeeEstimate>;
  broadcastTransaction(txHex: string): Promise<string>;
  
  // Wallet integration
  connectWallet(type: 'extension' | 'hardware'): Promise<WalletConnection>;
}
```

### 3. Indexer Service  
**File**: `src/services/indexerService.ts`

```typescript
interface IndexerService {
  // Project indexing
  indexProjects(): Promise<IndexedProject[]>;
  getProjectStats(projectId: string): Promise<ProjectStats>;
  
  // Search and filtering
  searchProjects(query: string): Promise<IndexedProject[]>;
  filterProjects(filters: ProjectFilters): IndexedProject[];
  
  // Caching
  getCachedProjects(): IndexedProject[];
  invalidateCache(): void;
}
```

## State Management Patterns

### App Context
**File**: `src/contexts/AppContext.tsx`

```typescript
interface AppContextState {
  // User authentication
  user: UserProfile | null;
  isAuthenticated: boolean;
  
  // Network state
  network: 'mainnet' | 'testnet';
  networkStatus: 'connected' | 'connecting' | 'disconnected';
  
  // Global UI state
  theme: 'light' | 'dark' | 'system';
  sidebar: {
    isOpen: boolean;
    isMobile: boolean;
  };
  
  // Application data
  projects: IndexedProject[];
  profiles: Map<string, ProfileData>;
  
  // Loading states
  loading: {
    projects: boolean;
    profiles: boolean;
    publishing: boolean;
  };
}
```

### Custom Hooks

#### useProjects Hook
```typescript
interface UseProjectsHook {
  // Data access
  projects: IndexedProject[];
  getProject: (id: string) => IndexedProject | undefined;
  
  // Filtering and search
  filteredProjects: IndexedProject[];
  searchProjects: (query: string) => void;
  filterProjects: (filters: ProjectFilters) => void;
  sortProjects: (sort: SortType) => void;
  
  // Actions
  refreshProjects: () => Promise<void>;
  subscribeToUpdates: (projectId: string) => () => void;
  
  // State
  loading: boolean;
  error: string | null;
}
```

## Page Components

### HomePage Component
**File**: `src/pages/HomePage.tsx`
```typescript
interface HomePageFeatures {
  // Hero section with clear value proposition
  heroSection: {
    title: string;
    subtitle: string;
    ctaButton: NavigationAction;
  };
  
  // Feature highlights
  features: FeatureCard[];
  
  // Recent projects preview
  recentProjects: ProjectPreview[];
  
  // Network status and statistics
  networkStats: NetworkStatistics;
}
```

### ExplorePage Component  
**File**: `src/pages/ExplorePage.tsx`
```typescript
interface ExplorePageFeatures {
  // Search and filtering
  searchFilters: {
    searchTerm: string;
    activeFilter: FilterType;
    activeSort: SortType;
  };
  
  // Project grid with infinite scroll
  projectGrid: {
    projects: IndexedProject[];
    loading: boolean;
    hasMore: boolean;
  };
  
  // Mobile-optimized filters
  mobileFilters: boolean;
}
```

### ProjectPage Component
**File**: `src/pages/ProjectPage.tsx`
```typescript
interface ProjectPageFeatures {
  // Project overview
  projectHeader: ProjectMetadata & ProjectDetails;
  
  // Funding information
  fundingStatus: {
    current: number;
    target: number;
    percentage: number;
    timeRemaining: number;
  };
  
  // Tabbed content
  tabs: {
    project: ProjectDescription;
    updates: ProjectUpdate[];
    faq: FaqItem[];
  };
  
  // Investment actions
  investmentActions: InvestmentControls;
}
```

## Authentication & User Management

### Nostr Extension Integration
```typescript
interface NostrExtension {
  // Extension detection
  detectExtension(): Promise<boolean>;
  
  // Authentication
  requestPermission(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  
  // Signing
  signEvent(event: UnsignedEvent): Promise<SignedEvent>;
  
  // Encryption/Decryption
  encrypt(plaintext: string, pubkey: string): Promise<string>;
  decrypt(ciphertext: string, pubkey: string): Promise<string>;
}
```

### Profile Management
```typescript
interface ProfileService {
  // Profile CRUD
  createProfile(profile: ProfileData): Promise<void>;
  updateProfile(updates: Partial<ProfileData>): Promise<void>;
  getProfile(pubkey: string): Promise<ProfileData>;
  
  // External identities
  linkGitHub(username: string): Promise<void>;
  linkTwitter(username: string): Promise<void>;
  linkWebsite(url: string): Promise<void>;
  
  // Verification
  verifyIdentity(identity: ExternalIdentity): Promise<boolean>;
}
```

## Bitcoin Integration Patterns

### Wallet Connection
```typescript
interface WalletService {
  // Connection management
  connect(type: WalletType): Promise<WalletConnection>;
  disconnect(): void;
  
  // Address management
  getReceiveAddress(): Promise<string>;
  getSigningAddress(): Promise<string>;
  
  // Transaction signing
  signPSBT(psbt: string): Promise<string>;
  broadcastTransaction(txHex: string): Promise<string>;
  
  // Balance and UTXO management
  getBalance(): Promise<number>;
  getUTXOs(): Promise<UTXO[]>;
}
```

### Investment Flow
```typescript
interface InvestmentFlow {
  // Investment creation
  createInvestment(projectId: string, amount: number): Promise<InvestmentTransaction>;
  
  // Multi-signature setup
  setupMultisig(participants: string[]): Promise<MultisigWallet>;
  
  // Release conditions
  createReleaseTransaction(stage: number): Promise<Transaction>;
  signRelease(txId: string): Promise<void>;
  
  // Recovery mechanisms
  createRecoveryTransaction(): Promise<Transaction>;
  claimRefund(investmentId: string): Promise<Transaction>;
}
```

## Performance Optimization

### Code Splitting
```typescript
// Route-based code splitting
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const ProjectPage = lazy(() => import('./pages/ProjectPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Component-based splitting for heavy components
const ProjectChart = lazy(() => import('./components/ProjectChart'));
const ImageGallery = lazy(() => import('./components/ImageGallery'));
```

### Loading States
**Use skeleton loading** for structured content (feeds, profiles, forms). **Use spinners** only for buttons or short operations.

```tsx
// Skeleton example matching component structure
<Card>
  <CardHeader>
    <div className="flex items-center space-x-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  </CardContent>
</Card>
```

### Empty States and No Content Found
When no content is found, display a minimalist empty state with the `RelaySelector` component.

```tsx
import { RelaySelector } from '@/components/RelaySelector';
import { Card, CardContent } from '@/components/ui/card';

<div className="col-span-full">
  <Card className="border-dashed">
    <CardContent className="py-12 px-8 text-center">
      <div className="max-w-sm mx-auto space-y-6">
        <p className="text-muted-foreground">
          No results found. Try another relay?
        </p>
        <RelaySelector className="w-full" />
      </div>
    </CardContent>
  </Card>
</div>
```

## Environment Configuration

### Environment Variables
```env
# Network Configuration
VITE_BITCOIN_NETWORK=mainnet|testnet
VITE_DEFAULT_RELAYS=wss://relay1.com,wss://relay2.com

# API Configuration  
VITE_INDEXER_API_URL=https://api.angor.io
VITE_BITCOIN_RPC_URL=https://bitcoin-rpc.angor.io

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false

# CDN Configuration
VITE_ASSET_CDN_URL=https://cdn.angor.io
```

### App Configuration
The project includes an `AppProvider` that manages global application state including theme and relay configuration. The default configuration includes:

```typescript
const defaultConfig: AppConfig = {
  theme: "light",
  relayUrl: "wss://relay.nostr.band",
};
```

## Routing

The project uses React Router with a centralized routing configuration in `AppRouter.tsx`. To add new routes:

1. Create your page component in `/src/pages/`
2. Import it in `AppRouter.tsx`
3. Add the route above the catch-all `*` route

The router includes automatic scroll-to-top functionality and a 404 NotFound page for unmatched routes.

## Testing Strategy

### Test Setup
The project uses Vitest with jsdom environment and includes comprehensive test setup:

- **Testing Library**: React Testing Library with jest-dom matchers
- **Test Environment**: jsdom with mocked browser APIs
- **Test App**: `TestApp` component provides all necessary context providers for testing

### Writing Tests
**Important**: Only create tests when the user is experiencing a specific problem or explicitly requests tests.

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(
      <TestApp>
        <MyComponent />
      </TestApp>
    );

    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### Testing Your Changes
Whenever you are finished modifying code, you must run the **test** script using the **js-dev__run_script** tool.

**Your task is not considered finished until this test passes without errors.**

## Development Best Practices

### Naming Conventions
- **Components**: PascalCase (e.g., `ProjectCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useProjects.ts`)
- **Services**: camelCase with 'Service' suffix (e.g., `nostrService.ts`)
- **Types**: PascalCase for interfaces (e.g., `ProjectData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_RELAYS`)

### Code Quality
- **Never use the `any` type**: Always use proper TypeScript types for type safety
- Keep components small, focused, and reusable
- Use React Context for global state, local state for component-specific data
- Follow WCAG 2.1 guidelines for accessibility
- Validate all inputs and sanitize content
- Use TypeScript strictly, follow ESLint rules, maintain consistent formatting

### Implementation Priorities

#### Phase 1: Core Foundation ✅
1. Basic React setup with TypeScript and Vite
2. Tailwind CSS integration with Angor brand colors
3. Basic routing with React Router
4. Component library setup (shadcn/ui)
5. Authentication infrastructure

#### Phase 2: Data Layer 🔄
1. Implement NostrifyService for relay connections
2. Create IndexerService for project data
3. Add BitcoinService for network integration
4. Set up state management with React Context

#### Phase 3: Core Pages 🔄
1. HomePage with hero and navigation ✅
2. ExplorePage with search/filter functionality
3. ProjectPage with detailed project view
4. ProfilePage for user management

#### Phase 4: Advanced Features 🔄
1. Real-time project updates
2. Investment flow implementation
3. Multi-signature wallet integration
4. Analytics and monitoring

#### Phase 5: Optimization 🔄
1. Performance optimization
2. Security audit and improvements
3. Accessibility compliance
4. Mobile optimization

---

*This document serves as the comprehensive guide for implementing and maintaining the Grants Platform React application. It should be updated as the project evolves and new patterns emerge.*
````
