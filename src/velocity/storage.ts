// reactivity/storage.ts
// ============================================================================

/* =========================
 * Types
 * ========================= */

export type StorageOptions<T = any> = {
    /** Storage key identifier */
    key: string;

    /** Enable encryption (default: false) */
    encrypt?: boolean;

    /** Encryption key (required if encrypt=true) */
    encryptionKey?: string;

    /** Schema validation */
    validate?: (value: unknown) => value is T;

    /** Default value */
    defaultValue?: T;

    /** Version for migrations */
    version?: number;

    /** Migration function */
    migrate?: (storedValue: unknown, storedVersion?: number) => T;

    /** Enable memory cache (default: true) */
    cache?: boolean;

    /** TTL in ms */
    ttl?: number;

    /** Custom serializer */
    serialize?: (value: any) => string;

    /** Custom deserializer */
    deserialize?: (value: string) => any;
};

type StorageItem<T> = {
    value: T;
    version?: number;
    timestamp: number;
    expiresAt?: number;
    encrypted?: boolean;
};

export type StorageEvent<T> = {
    key: string;
    oldValue: T | null;
    newValue: T | null;
    type: "set" | "remove" | "clear";
};

export type StorageListener<T> = (event: StorageEvent<T>) => void;

/* =========================
 * Encryption helpers
 * ========================= */

function encrypt(value: string, key: string): string {
    // Encode to UTF-8 bytes first to handle Unicode
    const utf8Bytes = new TextEncoder().encode(value);
    let result = "";
    for (let i = 0; i < utf8Bytes.length; i++) {
        result += String.fromCharCode(
            utf8Bytes[i] ^ key.charCodeAt(i % key.length)
        );
    }
    return btoa(result);
}

function decrypt(value: string, key: string): string {
    try {
        const decoded = atob(value);
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        }
        // Decode from UTF-8 bytes back to string
        return new TextDecoder().decode(bytes);
    } catch {
        throw new Error("Invalid encrypted data");
    }
}

/* =========================
 * Storage backend
 * ========================= */

class MemoryStorage implements Storage {
    private store = new Map<string, string>();

    get length() {
        return this.store.size;
    }

    clear(): void {
        this.store.clear();
    }

    getItem(key: string): string | null {
        return this.store.get(key) ?? null;
    }

    key(index: number): string | null {
        return Array.from(this.store.keys())[index] ?? null;
    }

    removeItem(key: string): void {
        this.store.delete(key);
    }

    setItem(key: string, value: string): void {
        this.store.set(key, value);
    }
}

// Use a singleton storage backend. Prefer the browser's `localStorage` when it's
// available and accessible (tested), otherwise fall back to the in-memory
// implementation. This allows secure/encrypted persistence via `createStorage`
// while remaining safe in SSR or restricted environments.
let _storageInstance: Storage | null = null;

function getStorage(): Storage {
    if (_storageInstance) return _storageInstance;

    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            // Test write access (some browsers or privacy modes disable it)
            const testKey = '__solid_storage_test__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            _storageInstance = window.localStorage;
            return _storageInstance;
        }
    } catch {
        // Access to localStorage is denied or throws — fall back
    }

    _storageInstance = new MemoryStorage();
    return _storageInstance;
}

/* =========================
 * Reactive storage
 * ========================= */

const storageListeners = new Map<string, Set<StorageListener<any>>>();

export function createStorage<T>(
    options: StorageOptions<T>
) {
    const {
        key,
        encrypt: useEncryption = false,
        encryptionKey,
        validate,
        defaultValue,
        version,
        migrate,
        cache = true,
        ttl,
        serialize = JSON.stringify,
        deserialize = JSON.parse,
    } = options;

    if (useEncryption && !encryptionKey) {
        throw new Error("encryptionKey is required when encrypt=true");
    }

    const storage = getStorage();
    let cachedValue: T | null = null;

    function notify(type: StorageEvent<T>["type"], oldValue: T | null, newValue: T | null) {
        const listeners = storageListeners.get(key);
        if (!listeners) return;

        const event: StorageEvent<T> = { key, type, oldValue, newValue };
        listeners.forEach((l) => l(event));
    }

    function load(): T {
        if (cache && cachedValue !== null) return cachedValue;

        const raw = storage.getItem(key);
        if (!raw) return defaultValue as T;

        try {
            const decoded = useEncryption
                ? decrypt(raw, encryptionKey!)
                : raw;

            const item = deserialize(decoded) as StorageItem<T>;

            if (item.expiresAt && Date.now() > item.expiresAt) {
                storage.removeItem(key);
                return defaultValue as T;
            }

            let value = item.value;

            if (migrate && version !== item.version) {
                value = migrate(value, item.version);
                save(value);
            }

            if (validate && !validate(value)) {
                return defaultValue as T;
            }

            if (cache) cachedValue = value;
            return value;
        } catch (err) {
            console.error(`[storage:${key}] load failed`, err);
            return defaultValue as T;
        }
    }

    function save(value: T) {
        const item: StorageItem<T> = {
            value,
            version,
            timestamp: Date.now(),
            expiresAt: ttl ? Date.now() + ttl : undefined,
            encrypted: useEncryption,
        };

        let serialized = serialize(item);
        if (useEncryption) {
            serialized = encrypt(serialized, encryptionKey!);
        }

        storage.setItem(key, serialized);
        if (cache) cachedValue = value;
    }

    return {
        /** Reactive getter */
        get(): T {
            return load();
        },

        /** Setter */
        set(next: T | ((prev: T) => T)) {
            const prev = load();
            const value = typeof next === "function"
                ? (next as (p: T) => T)(prev)
                : next;

            save(value);
            notify("set", prev, value);
        },

        /** Remove value */
        remove() {
            const prev = load();
            storage.removeItem(key);
            cachedValue = null;
            notify("remove", prev, null);
        },

        /** Check existence */
        has() {
            return storage.getItem(key) !== null;
        },

        /** Non-reactive read */
        peek() {
            return load();
        },

        /** Subscribe */
        subscribe(listener: StorageListener<T>) {
            const set = storageListeners.get(key) ?? new Set();
            set.add(listener);
            storageListeners.set(key, set);

            return () => set.delete(listener);
        },

        /** Clear ALL storage */
        clear() {
            storage.clear();
            notify("clear", null, null);
        },

        /** Storage size */
        size() {
            return storage.length;
        },

        /** Check expiry */
        isExpired() {
            const raw = storage.getItem(key);
            if (!raw) return false;

            try {
                const decoded = useEncryption
                    ? decrypt(raw, encryptionKey!)
                    : raw;

                const item = deserialize(decoded) as StorageItem<T>;
                return !!item.expiresAt && Date.now() > item.expiresAt;
            } catch {
                return true;
            }
        },

        /** Refresh TTL */
        refreshTTL() {
            const value = load();
            save(value);
        },
    };
}

/* =========================
 * Utilities
 * ========================= */

export function getStorageKeys(): string[] {
    const storage = getStorage();
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k) keys.push(k);
    }
    return keys;
}

export function clearAllStorage(): void {
    getStorage().clear();
}
