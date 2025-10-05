"use client"; // This is important! It tells Next.js this is a client-side component.

import { useState, useEffect } from 'react';

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';

// --- TYPE DEFINITIONS ---
interface AuthPayload {
  token: string;
  siteUrl: string;
  userId: number;
  username: string;
}

// Represents the basic data for an item in the list
interface ApiItem {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  meta: any; // Meta will be fully available from our custom endpoint
}

interface ItemDetails extends ApiItem {
    trip_name: string;
    customer_name?: string;
    customer_email?: string;
    status?: string;
}


// Reusable component for the loading spinner
function Loader({ size = 'w-10 h-10' }) {
    return (
        <div className={`loader animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 ${size}`}></div>
    );
}

// Main Application Component
export default function Home() {
    // State management
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loginError, setLoginError] = useState('');
    const [siteUrl, setSiteUrl] = useState('https://world.hyrosy.com');
    const [username, setUsername] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [bookings, setBookings] = useState<ApiItem[]>([]);
    const [enquiries, setEnquiries] = useState<ApiItem[]>([]);
    const [currentUsername, setCurrentUsername] = useState('');
    const [userId, setUserId] = useState<number | null>(null);
    const [selectedItemDetails, setSelectedItemDetails] = useState<ItemDetails | null>(null);

    // Check for stored login on initial load
    useEffect(() => {
        const storedAuth = localStorage.getItem('providerAuth');
        if (storedAuth) {
            const auth: AuthPayload = JSON.parse(storedAuth);
            setSiteUrl(auth.siteUrl);
            setCurrentUsername(auth.username);
            setUserId(auth.userId);
            setIsLoggedIn(true);
        }
        setIsLoading(false);
    }, []);

    // Fetch data when user logs in
    useEffect(() => {
        if (isLoggedIn && userId) {
            fetchData();
        }
    }, [isLoggedIn, userId]);

    // JWT LOGIN LOGIC
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError('');
        try {
            const tokenResponse = await fetch(`${siteUrl}/wp-json/jwt-auth/v1/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: appPassword }),
            });
            if (!tokenResponse.ok) {
                 const errorData = await tokenResponse.json();
                 throw new Error(errorData.message || 'Invalid username or password.');
            }
            const tokenData = await tokenResponse.json();
            const authPayload: AuthPayload = {
                username: tokenData.user_display_name,
                userId: tokenData.user_id,
                siteUrl: siteUrl,
                token: tokenData.token,
            };
            localStorage.setItem('providerAuth', JSON.stringify(authPayload));
            setUserId(authPayload.userId);
            setCurrentUsername(authPayload.username);
            setIsLoggedIn(true);
        } catch (error) {
            setLoginError(error instanceof Error ? error.message : String(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('providerAuth');
        setIsLoggedIn(false);
        setUsername('');
        setAppPassword('');
        setCurrentUsername('');
        setUserId(null);
        setBookings([]);
        setEnquiries([]);
    };

    // --- *** FINAL, SIMPLIFIED FETCH DATA LOGIC USING YOUR PLUGIN'S API *** ---
    const fetchData = async () => {
        setIsLoading(true);
        const storedAuthRaw = localStorage.getItem('providerAuth');
        if (!storedAuthRaw) {
            setIsLoading(false);
            return;
        }
        const storedAuth: AuthPayload = JSON.parse(storedAuthRaw);
        const headers = { 'Authorization': `Bearer ${storedAuth.token}` };

        try {
            // Make a single, powerful call to the new endpoint you created in your plugin.
            const response = await fetch(`${storedAuth.siteUrl}/wp-json/my-listings/v1/dashboard`, { headers });

            if (!response.ok) {
                throw new Error('Could not load dashboard data from your custom plugin endpoint.');
            }

            const data: { bookings: ApiItem[], enquiries: ApiItem[] } = await response.json();

            // The data is already filtered by your plugin! We just display it.
            setBookings(data.bookings || []);
            setEnquiries(data.enquiries || []);

        } catch (error) {
            console.error('Fetch Data Error:', error);
            setLoginError(error instanceof Error ? error.message : "Could not load dashboard data.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // This function now just formats the data for the dialog
    const formatItemDetails = (item: ApiItem): ItemDetails => {
        // Extract trip name from booking meta
        const orderItems = item.meta?.wte_order_items;
        let trip_name = 'Unknown Trip';
        if (orderItems) {
            try {
                const firstItemKey = Object.keys(orderItems)[0];
                trip_name = orderItems[firstItemKey]?.title || 'Unknown Trip';
            } catch (e) { /* ignore */ }
        }

        // For enquiries, we'd need to fetch the trip name separately if not in meta
        if (item.meta?.wp_travel_engine_enquiry_trip_id) {
            // This part can be enhanced later to fetch trip name for enquiries
        }

        const bookingSettings = item.meta?.wp_travel_engine_booking_setting || {};
        const billingDetails = item.meta?.wptravelengine_billing_details || {};
        
        return {
            ...item,
            trip_name: trip_name,
            customer_name: `${billingDetails.fname || ''} ${billingDetails.lname || ''}`.trim(),
            customer_email: billingDetails.email || 'N/A',
            status: bookingSettings.status || 'N/A'
        };
    };

    const handleCardClick = (item: ApiItem) => {
        const details = formatItemDetails(item);
        setSelectedItemDetails(details);
    };

    if (isLoading && !isLoggedIn) {
        return <div className="flex justify-center items-center h-screen"><Loader /></div>;
    }

    return (
        <main className="container mx-auto p-4 md:p-8 max-w-7xl">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Provider Dashboard</h1>
                {isLoggedIn && (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{`Logged in as: ${currentUsername}`}</span>
                        <Button onClick={handleLogout} variant="destructive">
                            Logout
                        </Button>
                    </div>
                )}
            </header>

            {!isLoggedIn ? (
                 <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
                    <Card className="w-full max-w-md">
                        <CardHeader><CardTitle className="text-2xl font-bold text-center">Login</CardTitle></CardHeader>
                        <CardContent>
                             {loginError && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                                    <strong className="font-bold">Error: </strong>
                                    <span className="block sm:inline">{loginError}</span>
                                </div>
                            )}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="site-url">WordPress Site URL:</Label>
                                    <Input type="text" id="site-url" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="e.g., https://world.hyrosy.com" />
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="username">Username:</Label>
                                    <Input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="password">Password:</Label>
                                    <Input type="password" id="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} />
                                    <p className="text-xs text-muted-foreground pt-1">Use your main WordPress password.</p>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader size="w-5 h-5" /> : "Login"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div id="dashboard-content">
                    {isLoading ? (
                         <div className="flex justify-center items-center h-64"><Loader /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Your Bookings</h2>
                                {bookings.length === 0 ? (
                                    <Card><CardContent className="pt-6"><p>No bookings found.</p></CardContent></Card>
                                ) : (
                                    <div className="space-y-4">
                                        {bookings.map(booking => (
                                            <Card key={booking.id} onClick={() => handleCardClick(booking)} className="cursor-pointer hover:border-primary transition-colors">
                                                <CardHeader>
                                                    <CardTitle className="text-lg">{booking.title?.rendered || 'Booking Details'}</CardTitle>
                                                    <CardDescription>Booking Date: {new Date(booking.date).toLocaleDateString()}</CardDescription>
                                                </CardHeader>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Your Enquiries</h2>
                                {enquiries.length === 0 ? (
                                    <Card><CardContent className="pt-6"><p>No enquiries found.</p></CardContent></Card>
                                ) : (
                                     <div className="space-y-4">
                                        {enquiries.map(enquiry => (
                                            <Card key={enquiry.id} onClick={() => handleCardClick(enquiry)} className="cursor-pointer hover:border-primary transition-colors">
                                                <CardHeader>
                                                     <CardTitle className="text-lg">{enquiry.title?.rendered || 'Enquiry Details'}</CardTitle>
                                                     <CardDescription>Enquiry Date: {new Date(enquiry.date).toLocaleDateString()}</CardDescription>
                                                </CardHeader>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <Dialog open={!!selectedItemDetails} onOpenChange={(isOpen) => !isOpen && setSelectedItemDetails(null)}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle>{selectedItemDetails?.title?.rendered || 'Details'}</DialogTitle>
                         {selectedItemDetails && <DialogDescription>
                            Received on {new Date(selectedItemDetails.date).toLocaleString()}
                        </DialogDescription>}
                    </DialogHeader>
                    {selectedItemDetails && (
                        <div className="grid gap-4 py-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="trip-name">Trip Name</Label>
                                <p id="trip-name" className="text-sm text-muted-foreground">{selectedItemDetails.trip_name}</p>
                            </div>
                            
                            {selectedItemDetails.customer_name && (
                                <>
                                    <Separator />
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="customer-name">Customer Name</Label>
                                        <p id="customer-name" className="text-sm text-muted-foreground">{selectedItemDetails.customer_name}</p>
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="customer-email">Customer Email</Label>
                                        <p id="customer-email" className="text-sm text-muted-foreground">{selectedItemDetails.customer_email}</p>
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="booking-status">Status</Label>
                                        <p id="booking-status" className="text-sm font-semibold capitalize">{selectedItemDetails.status}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </main>
    );
}

