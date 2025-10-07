"use client";

import { useAuth } from "../hooks/useAuth";
import { useApiData } from "../hooks/useApiData";
import { useNotifications } from "../hooks/useNotifications";

import { LoginForm } from "../components/app/LoginForm";
import { Dashboard } from "../components/app/Dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
    const { auth, login, logout, isAuthLoading } = useAuth();
    const { data, isLoading: isDataLoading, fetchData } = useApiData(auth);
    const notifications = useNotifications(auth);

    // Initial loading screen while checking auth
    if (isAuthLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                 <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
            </div>
        );
    }

    // Render based on authentication state
    return (
        <main className="container mx-auto p-4 md:p-8 max-w-7xl">
            {!auth.isLoggedIn ? (
                <LoginForm onLogin={login} isLoading={isDataLoading || isAuthLoading} />
            ) : (
                <Dashboard
                    user={auth}
                    data={data}
                    notifications={notifications}
                    onLogout={logout}
                    onRefresh={fetchData}
                    isRefreshing={isDataLoading}
                />
            )}
        </main>
    );
}

