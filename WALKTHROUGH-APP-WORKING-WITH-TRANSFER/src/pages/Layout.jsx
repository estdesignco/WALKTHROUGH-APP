
import React from 'react';

export default function Layout({ children, currentPageName }) {
    return (
        <div className="bg-[#2D3748] min-h-screen text-stone-200" style={{fontFamily: 'Century Gothic, sans-serif'}}>
            <style jsx global>{`
                * {
                    font-family: 'Century Gothic', 'Futura', sans-serif;
                }
                
                :root {
                    --color-primary: #8B7355; /* Much more muted gold */
                    --color-secondary: #1E293B; /* Dark Slate */
                    --color-accent: #A0927B; /* Even more muted accent */
                    --color-rich-green: #2F5233; /* Much more muted green */
                    --color-rich-red: #A8434A; /* Much more muted red */
                }
            `}</style>
            <main className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto">
                {children}
            </main>
        </div>
    );
}
