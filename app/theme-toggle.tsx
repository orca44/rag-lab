'use client';

import {useLayoutEffect, useState} from 'react';
import {Moon, Sun} from 'lucide-react';

// Same key as the inline script in app/layout.tsx.
const KEY='rag-lab-theme';
type Theme='light'|'dark';
function effectiveTheme():Theme {const t=document.documentElement.getAttribute('data-theme');if(t==='light'||t==='dark')return t;return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}

export default function ThemeToggle() {
 const [theme,setTheme]=useState<Theme|null>(null);
 useLayoutEffect(()=>{
  // Re-apply after React's development remount clears the attribute set by the inline script.
  try{const saved=localStorage.getItem(KEY);if(saved==='light'||saved==='dark')document.documentElement.setAttribute('data-theme',saved);}catch{}
  setTheme(effectiveTheme());
  const media=matchMedia('(prefers-color-scheme: dark)');const sync=()=>setTheme(effectiveTheme());
  media.addEventListener('change',sync);return ()=>media.removeEventListener('change',sync);
 },[]);
 function toggle(){const next:Theme=effectiveTheme()==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',next);try{localStorage.setItem(KEY,next);}catch{}setTheme(next);}
 const dark=theme==='dark';
 return <button className="theme-toggle" onClick={toggle} aria-label={dark?'Switch to light mode':'Switch to dark mode'} title={dark?'Switch to light mode':'Switch to dark mode'}>{dark?<Sun size={16}/>:<Moon size={16}/>}<span>{dark?'Light mode':'Dark mode'}</span></button>;
}
