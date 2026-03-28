"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] w-full bg-white backdrop-blur-xl border-b border-gray-200 shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 md:px-8 md:py-6 max-w-full overflow-visible">
        <Link 
          href="/" 
          className="text-2xl md:text-3xl font-black tracking-[-0.05em] text-primary font-headline uppercase hover:opacity-80 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        >
          THE TULIP DOOR
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-12 items-center">
          <Link href="/" className="font-headline font-bold tracking-tighter uppercase text-primary hover:text-secondary-container transition-colors">
            The Ritual
          </Link>
          <Link href="/gifting" className="font-headline font-bold tracking-tighter uppercase text-primary hover:text-secondary-container transition-colors">
            Gifting
          </Link>
          <Link href="#" className="font-headline font-bold tracking-tighter uppercase text-primary hover:text-secondary-container transition-colors">
            The Box
          </Link>
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex gap-6 items-center">
          {/* Cart disabled */}
          {/* <Link href="/cart" className="material-symbols-outlined text-primary hover:translate-x-1 hover:-translate-y-1 transition-transform duration-200">shopping_cart</Link> */}
          {status === "loading" ? (
            <span className="material-symbols-outlined text-primary animate-pulse">hourglass_empty</span>
          ) : session ? (
            <div className="flex items-center gap-4">
              <Link href="/account" className="material-symbols-outlined text-primary hover:translate-x-1 hover:-translate-y-1 transition-transform duration-200">person</Link>
              <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="font-headline font-bold text-[10px] uppercase tracking-widest text-primary hover:text-secondary-container transition-colors"
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link href="/login" className="font-headline font-bold text-[10px] uppercase tracking-widest text-primary hover:text-secondary-container transition-colors">
              Sign In
            </Link>
          )}
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
          <div className="flex flex-col px-6 py-4 gap-4">
            <Link 
              href="/" 
              className="font-headline font-bold tracking-tighter uppercase text-primary py-2 border-b border-primary/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              The Ritual
            </Link>
            <Link 
              href="/gifting" 
              className="font-headline font-bold tracking-tighter uppercase text-primary py-2 border-b border-primary/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              Gifting
            </Link>
            {/* Cart disabled */}
            {/* <Link 
              href="/cart" 
              className="font-headline font-bold tracking-tighter uppercase text-primary py-2 border-b border-primary/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              Cart
            </Link> */}
            {session ? (
              <>
                <Link 
                  href="/account" 
                  className="font-headline font-bold tracking-tighter uppercase text-primary py-2 border-b border-primary/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Account
                </Link>
                <button 
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    setMobileMenuOpen(false);
                  }}
                  className="font-headline font-bold tracking-tighter uppercase text-left text-primary py-2"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="font-headline font-bold tracking-tighter uppercase text-primary py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
