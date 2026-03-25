"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl">
        <div className="flex justify-between items-center px-6 py-4 md:px-8 md:py-4">
          <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter text-primary font-headline hover:opacity-80 transition-opacity">
            The Tulip Door
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-8 font-headline font-bold tracking-tight uppercase text-sm">
            <Link className="text-primary hover:text-secondary-container transition-colors" href="/account/rituals">My Rituals</Link>
            <Link className="text-zinc-500 hover:text-primary transition-colors" href="/account/drops">Past Drops</Link>
            <Link className="text-zinc-500 hover:text-primary transition-colors" href="/account/vault">Digital Vault</Link>
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/cart" className="material-symbols-outlined text-primary hover:opacity-80">shopping_cart</Link>
            <Link href="/account" className="material-symbols-outlined text-primary hover:opacity-80">account_circle</Link>
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="font-headline font-bold text-[10px] uppercase tracking-widest text-primary hover:text-secondary-container"
            >
              Log Out
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button 
            className="md:hidden flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-primary text-3xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-primary/10">
            <div className="flex flex-col px-6 py-4 gap-3">
              <Link href="/account" className="font-headline font-bold uppercase text-primary py-2 border-b border-primary/10" onClick={() => setMobileMenuOpen(false)}>
                Profile
              </Link>
              <Link href="/account/rituals" className="font-headline font-bold uppercase text-primary py-2 border-b border-primary/10" onClick={() => setMobileMenuOpen(false)}>
                My Rituals
              </Link>
              <Link href="/account/drops" className="font-headline font-bold uppercase text-primary py-2 border-b border-primary/10" onClick={() => setMobileMenuOpen(false)}>
                Past Drops
              </Link>
              <Link href="/account/shipping" className="font-headline font-bold uppercase text-primary py-2 border-b border-primary/10" onClick={() => setMobileMenuOpen(false)}>
                Shipping
              </Link>
              <Link href="/account/payment" className="font-headline font-bold uppercase text-primary py-2 border-b border-primary/10" onClick={() => setMobileMenuOpen(false)}>
                Payments
              </Link>
              <Link href="/account/vault" className="font-headline font-bold uppercase text-primary py-2 border-b border-primary/10" onClick={() => setMobileMenuOpen(false)}>
                Digital Vault
              </Link>
              <Link href="/cart" className="font-headline font-bold uppercase text-primary py-2 border-b border-primary/10" onClick={() => setMobileMenuOpen(false)}>
                Cart
              </Link>
              <button 
                onClick={() => {
                  signOut({ callbackUrl: "/" });
                  setMobileMenuOpen(false);
                }}
                className="font-headline font-bold uppercase text-left text-primary py-2"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-20 md:pt-20">
        {children}
      </main>
    </div>
  );
}
