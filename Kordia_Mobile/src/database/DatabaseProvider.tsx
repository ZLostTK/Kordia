import { type ReactNode } from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateIfNeeded } from './schema';

export function DatabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider databaseName="kordia.db" onInit={migrateIfNeeded} useSuspense>
      {children}
    </SQLiteProvider>
  );
}
