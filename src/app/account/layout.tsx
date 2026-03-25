"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/account", label: "Profile", icon: "person_edit" },
    { href: "/account/shipping", label: "Shipping", icon: "local_shipping" },
    { href: "/account/payment", label: "Payments", icon: "payments" },
    { href: "/account/rituals", label: "Rituals", icon: "shield_lock" },
    { href: "/account/vault", label: "Vault", icon: "folder_special" },
  ];

  const isActive = (href: string) => pathname === href;

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

      <div className="flex pt-20">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col py-10 px-6 gap-8 h-screen w-64 bg-surface-container border-r-0 fixed left-0">
          <div>
            <h2 className="font-headline font-bold text-primary text-xl">Account</h2>
            <p className="font-body font-medium uppercase tracking-widest text-[10px] text-zinc-500">The Digital Greenhouse</p>
          </div>
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-4 py-3 px-4 transition-all ${
                  isActive(item.href) 
                    ? "bg-secondary-container text-black font-black translate-x-2" 
                    : "text-primary hover:bg-primary-fixed hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-body font-medium uppercase tracking-widest text-[12px]">{item.label}</span>
              </Link>
            ))}
          </nav>
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-auto py-4 px-4 bg-primary text-white font-headline font-bold uppercase tracking-widest text-[12px] text-left hover:bg-primary-dim transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-8 lg:p-16 min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 w-full h-16 bg-white/90 backdrop-blur-lg flex justify-around items-center z-50">
        <Link href="/account" className={`flex flex-col items-center gap-1 ${pathname === '/account' ? 'text-primary' : 'text-zinc-400'}`}>
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-bold uppercase">Profile</span>
        </Link>
        <Link href="/account/shipping" className={`flex flex-col items-center gap-1 ${pathname === '/account/shipping' ? 'text-primary' : 'text-zinc-400'}`}>
          <span className="material-symbols-outlined">local_shipping</span>
          <span className="text-[10px] font-bold uppercase">Shipping</span>
        </Link>
        <Link href="/account/rituals" className={`flex flex-col items-center gap-1 ${pathname === '/account/rituals' ? 'text-primary' : 'text-zinc-400'}`}>
          <span className="material-symbols-outlined">shield</span>
          <span className="text-[10px] font-bold uppercase">Rituals</span>
        </Link>
        <Link href="/cart" className={`flex flex-col items-center gap-1 ${pathname === '/cart' ? 'text-primary' : 'text-zinc-400'}`}>
          <span className="material-symbols-outlined">shopping_bag</span>
          <span className="text-[10px] font-bold uppercase">Cart</span>
        </Link>
      </div>
    </div>
  );
}
