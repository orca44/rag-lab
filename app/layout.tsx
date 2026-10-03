import type { Metadata } from 'next';
import './globals.css';
import './visuals.css';
import './research.css';
import './labs.css';
import './examples.css';
import './playground.css';

export const metadata: Metadata = { title: 'RAG Lab · Explore retrieval-augmented generation', description: 'Compare six retrieval-augmented generation approaches with interactive examples, source exploration, and evaluation tools.' };
// Applies a saved theme before first paint; without one, CSS follows the system setting.
const themeScript = `(function(){try{var t=localStorage.getItem("rag-lab-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html: themeScript}}/></head><body>{children}</body></html>; }
