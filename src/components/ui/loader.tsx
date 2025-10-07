// components/ui/loader.tsx
export function Loader({ size = 'w-10 h-10' }) {
    return (
        <div className={`loader animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 ${size}`}></div>
    );
}