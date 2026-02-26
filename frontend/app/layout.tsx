import "./globals.css";

export const metadata = {
  title: "Aura Commerce",
  description: "A premium shopping experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <nav className="glass-nav">
          <div className="container-custom flex justify-between items-center h-[70px]">
            <div className="text-2xl font-bold tracking-tight gradient-text">
              Aura
            </div>
            <div className="flex gap-8 items-center">
              <a href="/" className="text-muted hover:text-white transition-colors duration-200">Home</a>
              <a href="/products" className="text-muted hover:text-white transition-colors duration-200">Products</a>
              <a href="/cart" className="text-muted hover:text-white transition-colors duration-200">Cart</a>
              <a href="/login" className="btn btn-primary">Sign In</a>
            </div>
          </div>
        </nav>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
