export default function HomePage() {
    return (
        <div className="container-custom mt-16 flex flex-col items-center text-center min-h-[80vh] relative">
            <div className="relative z-10">
                <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
                    Next-Generation <br /> <span className="gradient-text">Shopping Experience</span>
                </h1>
                <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
                    Discover curated products with an unparalleled design. Elevate your lifestyle with our premium collections.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/products" className="btn btn-primary px-8 py-4 text-lg">
                        Explore Collection
                    </a>
                    <a href="/register" className="btn bg-white/5 border border-card-border px-8 py-4 text-lg">
                        Create Account
                    </a>
                </div>
            </div>

            {/* Decorative Blob */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,rgba(0,0,0,0)_70%)] blur-[60px] z-0 pointer-events-none" />

            <div className="mt-24 w-full grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="card">
                    <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4 text-primary">
                        ✦
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Curated Selection</h3>
                    <p className="text-muted leading-relaxed text-[0.95rem]">Handpicked items that match your unparalleled taste.</p>
                </div>
                <div className="card">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 text-[#c084fc]">
                        ⚡
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                    <p className="text-muted leading-relaxed text-[0.95rem]">Experience instant browsing and seamless checkout flows.</p>
                </div>
                <div className="card">
                    <div className="h-10 w-10 rounded-lg bg-sky-500/20 flex items-center justify-center mb-4 text-[#38bdf8]">
                        🛡️
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
                    <p className="text-muted leading-relaxed text-[0.95rem]">Your data and transactions are protected by bleeding-edge security.</p>
                </div>
            </div>
        </div>
    );
}
