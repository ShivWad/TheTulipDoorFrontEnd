"use client";

import Link from "next/link";

export default function PastDropsPage() {
  return (
    <>
      <header className="mb-16">
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-headline font-black tracking-tighter leading-tight text-primary uppercase">
          Past <span className="bg-secondary-container px-4">Drops</span>
        </h1>
        <p className="font-body text-xl text-zinc-500 mt-6 max-w-xl">
          Your floral journey, one delivery at a time.
        </p>
      </header>

      <div className="bg-surface-container p-12 text-center">
        <div className="w-24 h-24 bg-primary-container mx-auto mb-6 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-primary">inventory_2</span>
        </div>
        <h2 className="font-headline font-black text-3xl uppercase mb-4">Your First Drop is Coming</h2>
        <p className="text-zinc-500 max-w-md mx-auto mb-8">
          Once your subscription begins, your weekly floral deliveries will appear here. 
          Each drop is a curated selection of seasonal blooms paired with a unique soundscape.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link 
            href="/account/rituals" 
            className="bg-secondary-container text-on-secondary-container px-8 py-4 font-headline font-bold uppercase tracking-widest"
          >
            View Subscription
          </Link>
          <Link 
            href="/" 
            className="border-2 border-primary text-primary px-8 py-4 font-headline font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>

      <div className="mt-16 opacity-10 pointer-events-none select-none">
        <h4 className="text-[12rem] font-headline font-black leading-none -tracking-widest text-primary uppercase text-center">The Tulip Door</h4>
      </div>
    </>
  );
}
