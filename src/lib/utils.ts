import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// --- TYPE DEFINITIONS ---
export interface BookingMeta {
    wp_travel_engine_booking_status?: string;
    wp_travel_engine_booking_payment_method?: string;
    cart_info?: { totals?: { total?: string }; currency?: string };
    wptravelengine_billing_details?: { fname?: string; lname?: string; email?: string };
    wp_travel_engine_booking_setting?: { place_order?: { traveler?: string } };
    wte_order_items?: { [key: string]: { currency?: { symbol?: string } } };
}

export interface ApiItem {
    id: number;
    date: string;
    title: { rendered: string };
    trip_name?: string;
    meta: BookingMeta;
}

export interface ItemDetails extends ApiItem {
    customer_name?: string;
    customer_email?: string;
    status?: string;
    travelers?: number;
    total_price?: string;
    payment_gateway?: string;
}

// --- FORMATTER FUNCTION ---
export const formatItemDetails = (item: ApiItem): ItemDetails => {
    const meta = item.meta || {};
    const billingDetails = meta.wptravelengine_billing_details;
    const cartInfo = meta.cart_info;

    // Use optional chaining for safer and cleaner access
    const customer_name = `${billingDetails?.fname || ''} ${billingDetails?.lname || ''}`.trim();
    const customer_email = billingDetails?.email || 'N/A';
    const travelers = parseInt(meta.wp_travel_engine_booking_setting?.place_order?.traveler || '0', 10);
    const status = meta.wp_travel_engine_booking_status || 'N/A';
    const payment_gateway = meta.wp_travel_engine_booking_payment_method || 'N/A';

    // Price formatting
    const totalPrice = parseFloat(cartInfo?.totals?.total || '0');
    const currencySymbol = Object.values(meta.wte_order_items || {})[0]?.currency?.symbol || cartInfo?.currency || '$';
    const total_price = `${currencySymbol}${totalPrice.toFixed(2)}`;

    return {
        ...item,
        trip_name: item.trip_name || 'Unknown Trip',
        customer_name,
        customer_email,
        status,
        travelers,
        total_price: totalPrice > 0 ? total_price : undefined,
        payment_gateway,
    };
};

