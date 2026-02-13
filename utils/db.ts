
import { openDB, IDBPDatabase } from 'idb';
import { HistoryItem, WorkspaceState } from '../types';

const DB_NAME = 'logicflow-db';
const DB_VERSION = 1;

interface LogicFlowDB {
    history: {
        key: string;
        value: HistoryItem;
    };
    workspace: {
        key: string;
        value: WorkspaceState;
    };
}

let dbPromise: Promise<IDBPDatabase<LogicFlowDB>>;

if (typeof window !== 'undefined') {
    dbPromise = openDB<LogicFlowDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('history')) {
                const historyStore = db.createObjectStore('history', { keyPath: 'id' });
                historyStore.createIndex('timestamp', 'timestamp');
            }
            if (!db.objectStoreNames.contains('workspace')) {
                db.createObjectStore('workspace');
            }
        },
    });
}

export const db = {
    async addHistory(item: HistoryItem) {
        const db = await dbPromise;
        return db.put('history', item);
    },

    async getHistory() {
        const db = await dbPromise;
        return db.getAllFromIndex('history', 'timestamp');
    },

    async deleteHistory(id: string) {
        const db = await dbPromise;
        return db.delete('history', id);
    },
    
    async clearHistory() {
        const db = await dbPromise;
        return db.clear('history');
    },

    async saveWorkspace(state: WorkspaceState) {
        const db = await dbPromise;
        return db.put('workspace', state, 'current');
    },

    async getWorkspace() {
        const db = await dbPromise;
        return db.get('workspace', 'current');
    }
};
