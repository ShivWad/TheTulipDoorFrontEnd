"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        <header className="mb-16">
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-headline font-black uppercase text-primary leading-none">Your Cart</h1>
        </header>

        <div className="bg-surface-container p-12 text-center">
          <span className="material-symbols-outlined text-8xl text-zinc-300">shopping_cart</span>
          <h2 className="text-3xl font-black uppercase mt-8 mb-4">Your Cart is Empty</h2>
          <p className="text-lg text-zinc-500 mb-8">
            Discover our curated flower subscriptions or send a gift to someone special.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/account/rituals" 
              className="bg-secondary-container text-on-secondary-container px-8 py-4 font-headline font-bold uppercase tracking-widest"
            >
              Subscribe Now
            </Link>
            <Link 
              href="/gifting" 
              className="border-2 border-primary text-primary px-8 py-4 font-headline font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors"
            >
              Send a Gift
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-surface-container py-12 px-8 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <div className="font-headline font-bold text-primary text-3xl mb-4 uppercase">THE TULIP DOOR</div>
            <p className="font-body font-medium uppercase tracking-[0.1em] text-sm text-primary/60">
              ©2026 THE TULIP DOOR. YOUR WEEKLY CREATIVE RESET.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
