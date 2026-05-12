import { 
  collection, 
  doc, 
  getDocs, 
  writeBatch, 
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Transaction } from '../App';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Sync transactions to Firestore
 * Handles batching to avoid the 500-operation limit
 */
export async function syncTransactionsToCloud(userId: string, transactions: Transaction[]) {
  if (!userId) return false;
  
  const path = `users/${userId}/transactions`;
  try {
    // Process in batches of 500
    const BATCH_SIZE = 500;
    const userTransactionsRef = collection(db, 'users', userId, 'transactions');
    
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = transactions.slice(i, i + BATCH_SIZE);
      
      chunk.forEach(t => {
        const docRef = doc(userTransactionsRef, t.id);
        batch.set(docRef, {
          id: t.id,
          type: t.type,
          amount: t.amount,
          date: t.date,
          categoryId: t.categoryId,
          category: t.category || '',
          note: t.note || '',
          createdAt: t.createdAt
        });
      });
      
      await batch.commit();
    }
    
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Subscribe to real-time transaction updates from Firestore
 */
export function subscribeToTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
  if (!userId) return () => {};
  
  const path = `users/${userId}/transactions`;
  const userTransactionsRef = collection(db, 'users', userId, 'transactions');
  const q = query(userTransactionsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: data.id,
        type: data.type as 'pemasukan' | 'pengeluaran',
        amount: data.amount,
        date: data.date,
        categoryId: data.categoryId,
        category: data.category,
        note: data.note,
        createdAt: data.createdAt
      });
    });
    callback(transactions);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

/**
 * Fetch transactions from Firestore
 */
export async function fetchTransactionsFromCloud(userId: string): Promise<Transaction[]> {
  if (!userId) return [];
  
  const path = `users/${userId}/transactions`;
  try {
    const userTransactionsRef = collection(db, 'users', userId, 'transactions');
    const q = query(userTransactionsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: data.id,
        type: data.type,
        amount: data.amount,
        date: data.date,
        categoryId: data.categoryId,
        category: data.category,
        note: data.note,
        createdAt: data.createdAt
      });
    });
    
    return transactions;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

/**
 * Merge logic to combine local and cloud transactions without duplicates,
 * keeping the most recently updated one (based on createdAt for now)
 */
export function mergeTransactions(local: Transaction[], cloud: Transaction[]): Transaction[] {
  const map = new Map<string, Transaction>();
  
  // Add local transactions first
  local.forEach(t => map.set(t.id, t));
  
  // Merge cloud transactions
  cloud.forEach(t => {
    const existing = map.get(t.id);
    if (!existing || t.createdAt > existing.createdAt) {
      map.set(t.id, t);
    }
  });
  
  return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
}
