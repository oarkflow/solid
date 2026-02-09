import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStorage, clearAllStorage } from '../storage';

describe('Storage', () => {
    beforeEach(() => {
        clearAllStorage();
        vi.clearAllMocks();
    });

    it('should store and retrieve simple values', async () => {
        const storage = createStorage<string>({
            key: 'test-simple',
            defaultValue: 'default'
        });

        expect(await storage.get()).toBe('default');
        await storage.set('hello');
        expect(await storage.get()).toBe('hello');
    });

    it('should support object storage with serialization', async () => {
        const value = { id: 1, name: 'Test' };
        const storage = createStorage<typeof value>({
            key: 'test-object',
            defaultValue: { id: 0, name: '' }
        });

        await storage.set(value);
        expect(await storage.get()).toEqual(value);
    });

    it('should handle removal', async () => {
        const storage = createStorage<string>({
            key: 'test-remove',
            defaultValue: 'default'
        });

        await storage.set('value');
        expect(await storage.has()).toBe(true);
        await storage.remove();
        expect(await storage.has()).toBe(false);
        expect(await storage.get()).toBe('default');
    });

    it('should notify subscribers', async () => new Promise<void>(done => {
        const storage = createStorage<string>({
            key: 'test-subscribe',
            defaultValue: ''
        });

        storage.subscribe(event => {
            expect(event.type).toBe('set');
            expect(event.newValue).toBe('updated');
            done();
        });

        storage.set('updated');
    }));

    describe('Encryption', () => {
        // Need to wait for async encryption operations
        it('should encrypt and decrypt values securely', async () => {
            const key = 'secret-password';
            const storage = createStorage<string>({
                key: 'test-encrypt',
                encrypt: true,
                encryptionKey: key,
                defaultValue: ''
            });

            const original = 'sensitive-data-123';
            await storage.set(original);

            // Should be able to read it back through the API
            const retrieved = await storage.get();
            expect(retrieved).toBe(original);

            // Directly inspect storage to verify encryption
            // Note: In test environment (JSDOM), we need to access the underlying storage if possible
            // But verify it's not plaintext in memory/mock storage
            const raw = window.localStorage.getItem('test-encrypt');
            expect(raw).not.toBe(null);
            expect(raw).not.toContain(original);
            expect(raw!.length).toBeGreaterThan(original.length); // Base64 overhead + salt + iv
        });

        it('should use random salt (different outputs for same input)', async () => {
            const key = 'secret-password';
            const val = 'same-value';

            const storage1 = createStorage<string>({
                key: 'test-salt-1',
                encrypt: true,
                encryptionKey: key,
                defaultValue: ''
            });

            await storage1.set(val);
            const raw1 = window.localStorage.getItem('test-salt-1');

            const storage2 = createStorage<string>({
                key: 'test-salt-2',
                encrypt: true,
                encryptionKey: key,
                defaultValue: ''
            });

            await storage2.set(val);
            const raw2 = window.localStorage.getItem('test-salt-2');

            expect(raw1).not.toBe(raw2);
        });

        it('should handle large data encryption without stack overflow', async () => {
            const key = 'secure-key';
            const largeString = 'A'.repeat(100 * 1024); // 100KB string

            const storage = createStorage<string>({
                key: 'test-large',
                encrypt: true,
                encryptionKey: key,
                defaultValue: ''
            });

            await storage.set(largeString);
            const result = await storage.get();
            expect(result).toBe(largeString);
        });
    });

    describe('TTL Expiry', () => {
        it('should expire values after TTL', async () => {
            vi.useFakeTimers();
            const storage = createStorage<string>({
                key: 'test-ttl',
                ttl: 1000,
                defaultValue: 'expired'
            });

            await storage.set('valid');
            expect(await storage.get()).toBe('valid');

            // Advance time past TTL
            vi.advanceTimersByTime(1100);

            // Should return default value (and clear storage internally)
            expect(await storage.get()).toBe('expired');

            vi.useRealTimers();
        });
    });
});
