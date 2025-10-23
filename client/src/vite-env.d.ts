/// <reference types="vite/client" />

// Thêm Buffer vào Window interface
interface Window {
    Buffer: typeof import("buffer").Buffer;
}
