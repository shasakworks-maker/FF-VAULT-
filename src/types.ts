export enum ListingStatus {
  AVAILABLE = 'available',
  SOLD = 'sold'
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  imageUrls: string[];
  features: string[];
  status: ListingStatus;
  sellerId: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
  level?: number;
  rank?: string;
  region?: string;
  // Account Credentials (Encrypted/Hidden until purchased)
  vaultId?: string;
  vaultPassword?: string;
  platform?: string;
  purchasedBy?: string;
  purchasedAt?: any;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'purchase' | 'system' | 'admin' | 'deposit';
  read: boolean;
  createdAt: any;
  metadata?: {
    listingId?: string;
    vaultId?: string;
    vaultPassword?: string;
    platform?: string;
  };
}

export enum DepositStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected'
}

export interface UserProfile {
  id: string;
  email: string;
  balance: number;
  updatedAt: any;
}

export interface Deposit {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  transactionId: string;
  status: DepositStatus;
  createdAt: any;
}

export interface AppSettings {
  qrUrl: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
