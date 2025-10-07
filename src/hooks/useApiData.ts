import { useState, useEffect, useCallback } from 'react';

// Assuming ApiItem is defined in a types file
interface ApiItem {
    id: number;
    date: string;
    title: { rendered: string };
    [key: string]: any;
}

interface ApiData {
    bookings: ApiItem[];
    enquiries: ApiItem[];
}

export function useApiData(auth: { isLoggedIn: boolean; token: string | null; siteUrl: string | null }) {
    const [data, setData] = useState<ApiData>({ bookings: [], enquiries: [] });
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!auth.isLoggedIn || !auth.token || !auth.siteUrl) {
             setIsLoading(false);
             return;
        }
        
        setIsLoading(true);
        try {
            const response = await fetch(`${auth.siteUrl}/wp-json/my-listings/v1/dashboard`, {
                headers: { 'Authorization': `Bearer ${auth.token}` },
            });
            if (!response.ok) throw new Error('Could not refresh data from the server.');

            const apiData: ApiData = await response.json();
            setData({
                bookings: apiData.bookings || [],
                enquiries: apiData.enquiries || [],
            });
            localStorage.setItem('cachedBookings', JSON.stringify(apiData.bookings || []));
            localStorage.setItem('cachedEnquiries', JSON.stringify(apiData.enquiries || []));
        } catch (error) {
            console.error('Fetch Data Error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [auth.isLoggedIn, auth.token, auth.siteUrl]);

    useEffect(() => {
        // Initial load from cache
        const cachedBookings = JSON.parse(localStorage.getItem('cachedBookings') || '[]');
        const cachedEnquiries = JSON.parse(localStorage.getItem('cachedEnquiries') || '[]');
        setData({ bookings: cachedBookings, enquiries: cachedEnquiries });

        if (auth.isLoggedIn) {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [auth.isLoggedIn, fetchData]);

    return { data, isLoading, fetchData };
}
