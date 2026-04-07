import { Suspense } from "react";
import OrdersContent from "./OrdersContent";

export default function OrdersPage() {
    return (
        <Suspense
            fallback={
                <div className="container-custom py-12 min-h-[80vh] flex items-center justify-center">
                    <div className="text-muted">Loading orders…</div>
                </div>
            }
        >
            <OrdersContent />
        </Suspense>
    );
}
