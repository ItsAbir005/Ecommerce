import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import with ssr:false so useSearchParams() is NEVER called
// during static generation / server-side rendering — this is the only
// approach that is 100% reliable with Turbopack on Vercel.
const OrdersContent = dynamic(() => import("./OrdersContent"), { ssr: false });

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
