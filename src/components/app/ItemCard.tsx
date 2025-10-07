import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatItemDetails, ItemDetails } from '../../lib/utils';

interface ItemCardProps {
    item: ItemDetails;
    onClick: () => void;
    index: number;
}

export function ItemCard({ item, onClick, index }: ItemCardProps) {
    const details = formatItemDetails(item);

    const getStatusVariant = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'confirmed':
            case 'booking-confirmed':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
            <Card onClick={onClick} className="cursor-pointer transition-colors hover:border-primary">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className='max-w-[80%]'>
                            <CardTitle className="text-lg truncate">{details.trip_name || 'Details'}</CardTitle>
                             <CardDescription>{`On ${new Date(details.date).toLocaleDateString()}`}</CardDescription>
                        </div>
                        {details.status && (
                             <Badge variant={getStatusVariant(details.status)} className="capitalize">{details.status.replace(/-/g, ' ')}</Badge>
                        )}
                    </div>
                    {details.customer_name && (
                        <div className="text-sm text-muted-foreground pt-2">
                            <p>{details.customer_name}</p>
                        </div>
                    )}
                </CardHeader>
            </Card>
        </motion.div>
    );
}

