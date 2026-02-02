/* Environment typings for Vite-like `import.meta.env` vars */

interface ImportMetaEnv {
    readonly VITE_APP_ENV?: string;
    // add other env vars here as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
