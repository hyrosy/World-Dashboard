import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatItemDetails, ItemDetails } from '../../lib/utils';

interface DetailsDialogProps {
    item: ItemDetails | null;
    isOpen: boolean;
    onClose: () => void;
}

export function DetailsDialog({ item, isOpen, onClose }: DetailsDialogProps) {
    if (!item) return null;

    const details = formatItemDetails(item);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{details.title?.rendered || 'Details'}</DialogTitle>
                    <DialogDescription>
                        Received on {new Date(details.date).toLocaleString()}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4 text-sm">
                    <DetailRow label="Trip Name" value={details.trip_name} />
                    {details.customer_name && (
                         <>
                             <Separator />
                             <DetailRow label="Customer Name" value={details.customer_name} />
                             <DetailRow label="Customer Email" value={details.customer_email} />
                             <DetailRow label="Travelers" value={details.travelers} />
                             <DetailRow label="Booking Status" value={details.status?.replace(/-/g, ' ')} isHighlight />
                         </>
                    )}
                    {details.total_price && (
                         <>
                             <Separator />
                             <DetailRow label="Payment Method" value={details.payment_gateway?.replace(/_/g, ' ')} />
                             <DetailRow label="Total Price" value={details.total_price} isHighlight />
                         </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DetailRow({ label, value, isHighlight = false }: { label: string; value?: string | number; isHighlight?: boolean }) {
    if (!value) return null;
    return (
        <div className="flex justify-between items-center capitalize">
            <p className="text-muted-foreground">{label}</p>
            <p className={isHighlight ? 'font-semibold' : ''}>{String(value)}</p>
        </div>
    );
}

