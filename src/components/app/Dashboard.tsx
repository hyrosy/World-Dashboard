import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "../ui/loader";
import { ItemCard } from "./ItemCard";
import { DetailsDialog } from "./DetailsDialog";
import { ApiItem, ItemDetails } from '../../lib/utils';
import { Bell, BellRing, BookUser, HelpCircle, LogOut, RefreshCw } from 'lucide-react';

type AuthUser = { username: string };
type ApiData = { bookings: ApiItem[], enquiries: ApiItem[] };
type Notifications = {
    isSubscribed: boolean;
    permission: NotificationPermission;
    isLoading: boolean;
    handleSubscription: () => void;
};

interface DashboardProps {
    user: AuthUser;
    data: ApiData;
    notifications: Notifications;
    onLogout: () => void;
    onRefresh: () => void;
    isRefreshing: boolean;
}

export function Dashboard({ user, data, notifications, onLogout, onRefresh, isRefreshing }: DashboardProps) {
    const [selectedItem, setSelectedItem] = useState<ItemDetails | null>(null);

    return (
        <>
            <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold">Provider Dashboard</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground hidden sm:inline">{`Welcome, ${user.username}`}</span>
                     <Button onClick={onRefresh} variant="outline" size="icon" disabled={isRefreshing} aria-label="Refresh Data">
                        {isRefreshing ? <Loader size="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                     </Button>
                    <Button onClick={onLogout} variant="destructive">
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DataSection
                        title="Your Bookings"
                        icon={<BookUser className="w-6 h-6 text-muted-foreground" />}
                        items={data.bookings}
                        isLoading={isRefreshing && data.bookings.length === 0}
                        onCardClick={(item) => setSelectedItem(item as ItemDetails)}
                    />
                     <DataSection
                        title="Your Enquiries"
                        icon={<HelpCircle className="w-6 h-6 text-muted-foreground" />}
                        items={data.enquiries}
                        isLoading={isRefreshing && data.enquiries.length === 0}
                        onCardClick={(item) => setSelectedItem(item as ItemDetails)}
                    />
                </div>

                <aside className="space-y-8">
                    <NotificationCard {...notifications} />
                </aside>
            </div>

            <DetailsDialog
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </>
    );
}

interface DataSectionProps {
    title: string;
    icon: React.ReactNode;
    items: ApiItem[];
    isLoading: boolean;
    onCardClick: (item: ApiItem) => void;
}

function DataSection({ title, icon, items, isLoading, onCardClick }: DataSectionProps) {
    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                {icon}
                <h2 className="text-2xl font-bold">{title}</h2>
            </div>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : items.length === 0 ? (
                <Card><CardContent className="pt-6"><p>No {title.toLowerCase().split(' ')[1]} found.</p></CardContent></Card>
            ) : (
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            onClick={() => onCardClick(item)}
                            index={index}
                         />
                    ))}
                </div>
            )}
        </div>
    );
}

function NotificationCard({ isSubscribed, permission, isLoading, handleSubscription }: Notifications) {
    const renderContent = () => {
        if (permission === 'granted') {
            if (isSubscribed) {
                return <p className="text-sm text-green-600 flex items-center"><BellRing className="w-4 h-4 mr-2"/> You&apore subscribed to notifications.</p>;
            }
            return <Button onClick={handleSubscription} disabled={isLoading}>{isLoading ? 'Subscribing...' : 'Enable Notifications'}</Button>;
        }
        if (permission === 'denied') {
            return <p className="text-sm text-red-600">You have blocked notifications. Please enable them in your browser settings.</p>;
        }
        return <Button onClick={handleSubscription} disabled={isLoading}>{isLoading ? <Loader size="w-5 h-5"/> : 'Enable Notifications'}</Button>;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Push Notifications</CardTitle>
                <Bell className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground mb-4">Get notified instantly of new activity.</p>
                {renderContent()}
            </CardContent>
        </Card>
    );
}

