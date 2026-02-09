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

const SALT_LEN = 16;
const IV_LEN = 12;

function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    const chunk = 8192; // Chunk size to avoid stack overflow
    let binary = '';
    for (let i = 0; i < len; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
    }
    return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function deriveKey(rawKey: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(rawKey),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as unknown as BufferSource,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encrypt(value: string, key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));

    const cryptoKey = await deriveKey(key, salt);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
    );

    // Format: Salt + IV + Ciphertext
    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

    return bufferToBase64(combined.buffer);
}

async function decrypt(value: string, key: string): Promise<string> {
    try {
        const decoder = new TextDecoder();
        const raw = base64ToBuffer(value);

        // Try new format (Salt + IV + Cipher)
        if (raw.length > SALT_LEN + IV_LEN) {
            try {
                const salt = raw.slice(0, SALT_LEN);
                const iv = raw.slice(SALT_LEN, SALT_LEN + IV_LEN);
                const ciphertext = raw.slice(SALT_LEN + IV_LEN);

                const cryptoKey = await deriveKey(key, salt);

                const plaintext = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv },
                    cryptoKey,
                    ciphertext
                );

                return decoder.decode(plaintext);
            } catch (e) {
                // Decryption failed, might be legacy format
            }
        }

        // Legacy format fallback (Fixed Salt + IV + Cipher)
        const iv = raw.slice(0, IV_LEN);
        const ciphertext = raw.slice(IV_LEN);
        const fixedSalt = new TextEncoder().encode('velocity-storage-salt');

        const cryptoKey = await deriveKey(key, fixedSalt);

        const plaintext = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            ciphertext
        );

        return decoder.decode(plaintext);
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
    let cachedValue: { value: T; expiresAt?: number } | null = null;

    function notify(type: StorageEvent<T>["type"], oldValue: T | null, newValue: T | null) {
        const listeners = storageListeners.get(key);
        if (!listeners) return;

        const event: StorageEvent<T> = { key, type, oldValue, newValue };
        listeners.forEach((l) => l(event));
    }

    async function load(): Promise<T> {
        if (cache && cachedValue !== null) {
            if (cachedValue.expiresAt && Date.now() > cachedValue.expiresAt) {
                cachedValue = null;
                storage.removeItem(key);
                return defaultValue as T;
            }
            return cachedValue.value;
        }

        const raw = storage.getItem(key);
        if (!raw) return defaultValue as T;

        try {
            const decoded = useEncryption
                ? await decrypt(raw, encryptionKey!)
                : raw;

            const item = deserialize(decoded) as StorageItem<T>;

            if (item.expiresAt && Date.now() > item.expiresAt) {
                storage.removeItem(key);
                return defaultValue as T;
            }

            let value = item.value;

            if (migrate && version !== item.version) {
                value = migrate(value, item.version);
                await save(value);
            }

            if (validate && !validate(value)) {
                return defaultValue as T;
            }

            if (cache) {
                cachedValue = {
                    value,
                    expiresAt: item.expiresAt
                };
            }
            return value;
        } catch (err) {
            console.error(`[storage:${key}] load failed`, err);
            return defaultValue as T;
        }
    }

    async function save(value: T) {
        const timestamp = Date.now();
        const expiresAt = ttl ? timestamp + ttl : undefined;

        const item: StorageItem<T> = {
            value,
            version,
            timestamp,
            expiresAt,
            encrypted: useEncryption,
        };

        let serialized = serialize(item);
        if (useEncryption) {
            serialized = await encrypt(serialized, encryptionKey!);
        }

        storage.setItem(key, serialized);
        if (cache) {
            cachedValue = { value, expiresAt };
        }
    }

    return {
        /** Reactive getter */
        async get(): Promise<T> {
            return await load();
        },

        /** Setter */
        async set(next: T | ((prev: T) => T)) {
            const prev = await load();
            const value = typeof next === "function"
                ? (next as (p: T) => T)(prev)
                : next;

            await save(value);
            notify("set", prev, value);
        },

        /** Remove value */
        async remove() {
            const prev = await load();
            storage.removeItem(key);
            cachedValue = null;
            notify("remove", prev, null);
        },

        /** Check existence */
        has() {
            return storage.getItem(key) !== null;
        },

        /** Non-reactive read */
        async peek() {
            return await load();
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
        async isExpired() {
            if (cache && cachedValue?.expiresAt) {
                return Date.now() > cachedValue.expiresAt;
            }

            const raw = storage.getItem(key);
            if (!raw) return false;

            try {
                const decoded = useEncryption
                    ? await decrypt(raw, encryptionKey!)
                    : raw;

                const item = deserialize(decoded) as StorageItem<T>;
                return !!item.expiresAt && Date.now() > item.expiresAt;
            } catch {
                return true;
            }
        },

        /** Refresh TTL */
        async refreshTTL() {
            const value = await load();
            await save(value);
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
