"use client";

import dynamic from "next/dynamic";

const MapTrackerInner = dynamic(() => import("./MapTrackerInner"), {
    ssr: false,
    loading: () => (
        <div style={{ height: "340px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>🗺️</span>
            <span style={{ fontSize: "13px" }}>Loading Live Tracker...</span>
        </div>
    )
});

export default function MapTracker(props: any) {
    return <MapTrackerInner {...props} />;
}
