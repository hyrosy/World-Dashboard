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
  userId?: number;
  username: string;
}

// FIX 1: Replaced 'any' with a specific type for the meta object
interface BookingMeta {
  wp_travel_engine_booking_status?: string;
  wp_travel_engine_booking_payment_method?: string;
  cart_info?: {
    totals?: {
      total?: string;
    };
    currency?: string;
  };
  wptravelengine_billing_details?: {
    fname?: string;
    lname?: string;
    email?: string;
  };
  wp_travel_engine_booking_setting?: {
    place_order?: {
      traveler?: string;
    };
  };
  wte_order_items?: {
    [key: string]: {
      title?: string;
      price?: string;
      currency?: {
        symbol?: string;
      };
    };
  };
}

// Represents the basic data for an item in the list
interface ApiItem {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  trip_name?: string; // This is added from the PHP function
  meta: BookingMeta;
}

interface ItemDetails extends ApiItem {
    customer_name?: string;
    customer_email?: string;
    status?: string;
    travelers?: number;
    total_price?: string;
    payment_gateway?: string;
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
    const [username, setUsername] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [bookings, setBookings] = useState<ApiItem[]>([]);
    const [enquiries, setEnquiries] = useState<ApiItem[]>([]);
    const [currentUsername, setCurrentUsername] = useState('');
    const [selectedItemDetails, setSelectedItemDetails] = useState<ItemDetails | null>(null);
    // FIX 2: Removed unused userId state
    // const [userId, setUserId] = useState<number | null>(null);

    // Check for stored login on initial load
    useEffect(() => {
        const storedAuth = localStorage.getItem('providerAuth');
        if (storedAuth) {
            const auth: AuthPayload = JSON.parse(storedAuth);
            setCurrentUsername(auth.username);
            // setUserId(auth.userId ?? null); // No longer needed
            setIsLoggedIn(true);
        }
        setIsLoading(false);
    }, []);

    // Fetch data when user logs in
    useEffect(() => {
        if (isLoggedIn) {
            fetchData();
        }
    }, [isLoggedIn]);

    // JWT LOGIN LOGIC
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError('');
        try {
            const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
            const tokenResponse = await fetch(`${apiUrl}/wp-json/jwt-auth/v1/token`, {
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
                siteUrl: apiUrl || '',
                token: tokenData.token,
            };
            localStorage.setItem('providerAuth', JSON.stringify(authPayload));
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
        // setUserId(null); // No longer needed
        setBookings([]);
        setEnquiries([]);
    };

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
            const response = await fetch(`${storedAuth.siteUrl}/wp-json/my-listings/v1/dashboard`, { headers });

            if (!response.ok) {
                throw new Error('Could not load dashboard data from your custom plugin endpoint.');
            }

            const data: { bookings: ApiItem[], enquiries: ApiItem[] } = await response.json();

            setBookings(data.bookings || []);
            setEnquiries(data.enquiries || []);

        } catch (error) {
            console.error('Fetch Data Error:', error);
            setLoginError(error instanceof Error ? error.message : "Could not load dashboard data.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const formatItemDetails = (item: ApiItem): ItemDetails => {
        const meta = item.meta || {};
        const orderItems = meta.wte_order_items;
        const billingDetails = meta.wptravelengine_billing_details || {};
        const cartInfo = meta.cart_info || {};
        
        // Use the trip_name sent directly from the API
        const trip_name = item.trip_name || 'Unknown Trip';

        // Recalculate price and currency just in case, but primarily use cart_info
        const totalPrice = parseFloat(cartInfo.totals?.total || '0');
        let currencySymbol = cartInfo.currency === 'USD' ? '$' : cartInfo.currency;

        if (orderItems) {
            try {
                // This part can serve as a fallback if cart_info is missing details
                for (const key in orderItems) {
                    if (orderItems.hasOwnProperty(key)) {
                         if (orderItems[key].currency && orderItems[key].currency.symbol) {
                            currencySymbol = orderItems[key].currency.symbol;
                         }
                    }
                }
            } catch { /* Removed unused 'e' variable */ }
        }
        
        const formattedPrice = `${currencySymbol || '$'}${totalPrice.toFixed(2)}`;

        const travelers = parseInt(meta.wp_travel_engine_booking_setting?.place_order?.traveler || '0');
        const status = meta.wp_travel_engine_booking_status || 'N/A';
        const payment_gateway = meta.wp_travel_engine_booking_payment_method || 'N/A';

        return {
            ...item,
            trip_name: trip_name,
            customer_name: `${billingDetails.fname || ''} ${billingDetails.lname || ''}`.trim(),
            customer_email: billingDetails.email || 'N/A',
            status: status,
            travelers: travelers,
            total_price: formattedPrice,
            payment_gateway: payment_gateway,
        };
    };

    const handleCardClick = (item: ApiItem) => {
        // console.log("Clicked Item Meta:", item.meta); // You can re-enable this for debugging
        const details = formatItemDetails(item);
        setSelectedItemDetails(details);
    };

    if (isLoading && !isLoggedIn) {
        return <div className="flex justify-center items-center h-screen"><Loader /></div>;
    }

    return (
        <main className="container mx-auto p-4 md:p-8 max-w-7xl">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">hyrosy World Provider</h1>
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
                                    <Label htmlFor="username">Username:</Label>
                                    <Input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="password">Password:</Label>
                                    <Input type="password" id="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} />
                                    <p className="text-xs text-muted-foreground pt-1">Reach out to us if you forgot your password. Or reset it at world.hyrosy.com</p>
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

                        <div className="grid gap-4 py-4 text-sm">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="trip-name">Trip Name</Label>
                                <p id="trip-name" className="text-muted-foreground">{selectedItemDetails.trip_name}</p>
                            </div>

                            {/* --- Customer & Booking Details Section --- */}
                            {selectedItemDetails.customer_name && (
                                <>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="customer-name">Customer Name</Label>
                                        <p id="customer-name" className="text-muted-foreground">{selectedItemDetails.customer_name}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="customer-email">Customer Email</Label>
                                        <p id="customer-email" className="text-muted-foreground">{selectedItemDetails.customer_email}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="travelers">Travelers</Label>
                                        <p id="travelers" className="text-muted-foreground">{selectedItemDetails.travelers}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="booking-status">Booking Status</Label>
                                        <p id="booking-status" className="font-semibold capitalize">{selectedItemDetails.status}</p>
                                    </div>
                                </>
                            )}

                            {/* --- Payment Details Section --- */}
                            {selectedItemDetails.total_price && (
                                <>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="payment-gateway">Payment Method</Label>
                                        <p id="payment-gateway" className="text-muted-foreground">{selectedItemDetails.payment_gateway}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="total-price" className="font-semibold">Total Price</Label>
                                        <p id="total-price" className="font-semibold">{selectedItemDetails.total_price}</p>
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

