export interface AngorProject {
  projectIdentifier: string;
  nostrPubKey?: string;
  nostrEventId?: string;
  targetAmount: number;
  amountInvested: number;
  investorCount: number;
  penaltyDays: number;
  founderKey: string;
  createdOnBlock: number;
  trxId: string;
  metadata?: ProjectMetadata;
  stats?: ProjectStats;
  details?: ProjectDetails;
  profile?: NostrProfile;
  faq?: ProjectFAQ;
  media?: ProjectMedia;
  members?: ProjectMembers;
}

export interface ProjectMetadata {
  name: string;
  about: string;
  banner?: string;
  picture?: string;
  website?: string;
  lud16?: string; // Lightning address
  tags?: string[];
  category?: string;
}

export interface ProjectStats {
  amountInvested: number;
  investorCount: number;
  completionPercentage: number;
  lastUpdated: number;
  targetAmount: number;
  daysRemaining?: number;
  status: 'active' | 'completed' | 'expired' | 'upcoming';
}

export interface ProjectDetails {
  targetAmount: number;
  startDate: number;
  expiryDate: number;
  nostrPubKey: string;
  projectIdentifier: string;
  createdOnBlock: number;
  stages?: ProjectStage[];
  description?: string;
  roadmap?: string[];
}

export interface ProjectStage {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  releaseDate: number;
  isCompleted: boolean;
}

export interface NostrProfile {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  lud16?: string;
  nip05?: string;
}

export interface ProjectInvestment {
  investorPublicKey: string;
  totalAmount: number;
  transactionId: string;
  timeInvested: number;
  isSeeder: boolean;
}

export interface ProjectFAQ {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

export interface ProjectMedia {
  images?: string[];
  videos?: string[];
  documents?: string[];
  gallery?: Array<{
    url: string;
    type: 'image' | 'video' | 'document';
    caption?: string;
  }>;
}

export interface ProjectMembers {
  team: Array<{
    pubkey: string;
    name?: string;
    role: string;
    bio?: string;
    picture?: string;
  }>;
}

export interface IndexedProject {
  project: AngorProject;
  projectData: ProjectDetails;
  profile: NostrProfile;
  stats: ProjectStats;
  investments: ProjectInvestment[];
  faq: ProjectFAQ;
  media: ProjectMedia;
  members: ProjectMembers;
  pubKeyToUse?: string;
  index: number;
}

// Filter & Sort Types
export type FilterType = 'all' | 'active' | 'upcoming' | 'completed' | 'expired';
export type SortType = 'default' | 'funding' | 'endDate' | 'investors' | 'newest' | 'amount';

export interface ProjectFilters {
  search?: string;
  status?: FilterType;
  minAmount?: number;
  maxAmount?: number;
  categories?: string[];
  sortBy?: SortType;
}

// Angor-specific event kinds
export const ANGOR_EVENT_KINDS = {
  PROJECT_DETAILS: 30382,
  PROJECT_UPDATE: 30383,
  PROJECT_INVESTMENT: 30384,
  PROJECT_MILESTONE: 30385,
  PROFILE_METADATA: 0,
  PROJECT_NOTE: 1,
  PROJECT_REACTION: 7,
  ADDITIONAL_DATA: 30078
} as const;

// Constants
export const ANGOR_INDEXER_BASE_URL = {
  mainnet: 'https://explorer.angor.io/',
  testnet: 'https://tbtc.indexer.angor.io/'
};

export const ANGOR_RELAY_POOL = {
  mainnet: [
    'wss://relay.damus.io',
    'wss://relay.primal.net',
    'wss://nos.lol',
    'wss://relay.angor.io',
    'wss://relay2.angor.io'
  ],
  testnet: [
    'wss://relay.damus.io',
    'wss://relay.primal.net',
    'wss://nos.lol',
    'wss://relay.angor.io',
    'wss://relay2.angor.io'
  ]
} as const;
