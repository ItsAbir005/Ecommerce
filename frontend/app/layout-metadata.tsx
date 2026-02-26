import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Aura Commerce',
    description: 'A premium shopping experience',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
        </>
    );
}
