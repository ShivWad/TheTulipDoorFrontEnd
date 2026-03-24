import Link from "next/link";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Top Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-8 h-20 border-none">
        <Link href="/" className="text-2xl font-black tracking-tighter text-primary font-headline hover:opacity-80 transition-opacity">
          The Tulip Door
        </Link>
        <div className="hidden md:flex gap-12 font-headline font-bold tracking-tight uppercase">
          <Link className="text-zinc-500 hover:text-primary transition-colors" href="/account/rituals">My Rituals</Link>
          <Link className="text-zinc-500 hover:text-primary transition-colors" href="#">Past Drops</Link>
          <Link className="text-zinc-500 hover:text-primary transition-colors" href="/account/vault">Digital Vault</Link>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/account" className="material-symbols-outlined text-primary hover:opacity-80 transition-opacity">account_circle</Link>
          <button className="material-symbols-outlined text-primary">shopping_cart</button>
        </div>
      </nav>

      <div className="flex pt-20">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col py-10 px-6 gap-8 h-screen w-64 bg-surface-container border-r-0 fixed left-0">
          <div>
            <h2 className="font-headline font-bold text-primary text-xl">Account</h2>
            <p className="font-body font-medium uppercase tracking-widest text-[10px] text-zinc-500">The Digital Greenhouse</p>
          </div>
          <nav className="flex flex-col gap-4">
            <Link href="/account" className="flex items-center gap-4 py-3 px-4 bg-secondary-container text-black font-black translate-x-2">
              <span className="material-symbols-outlined">person_edit</span>
              <span className="font-body font-medium uppercase tracking-widest text-[12px]">Profile</span>
            </Link>
            <Link href="/account/shipping" className="flex items-center gap-4 py-3 px-4 text-primary hover:bg-primary-fixed hover:text-white transition-all">
              <span className="material-symbols-outlined">local_shipping</span>
              <span className="font-body font-medium uppercase tracking-widest text-[12px]">Shipping</span>
            </Link>
            <Link href="/account/payment" className="flex items-center gap-4 py-3 px-4 text-primary hover:bg-primary-fixed hover:text-white transition-all">
              <span className="material-symbols-outlined">payments</span>
              <span className="font-body font-medium uppercase tracking-widest text-[12px]">Payments</span>
            </Link>
            <Link href="/account/rituals" className="flex items-center gap-4 py-3 px-4 text-primary hover:bg-primary-fixed hover:text-white transition-all">
              <span className="material-symbols-outlined">shield_lock</span>
              <span className="font-body font-medium uppercase tracking-widest text-[12px]">Rituals</span>
            </Link>
            <Link href="/account/vault" className="flex items-center gap-4 py-3 px-4 text-primary hover:bg-primary-fixed hover:text-white transition-all">
              <span className="material-symbols-outlined">folder_special</span>
              <span className="font-body font-medium uppercase tracking-widest text-[12px]">Vault</span>
            </Link>
          </nav>
          <button className="mt-auto py-4 px-4 bg-primary text-white font-headline font-bold uppercase tracking-widest text-[12px] text-left">
            Log Out
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-8 lg:p-16 min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 w-full h-16 bg-white/90 backdrop-blur-lg flex justify-around items-center z-50">
        <Link href="/" className="material-symbols-outlined text-primary">home</Link>
        <button className="material-symbols-outlined text-primary">search</button>
        <Link href="/account" className="material-symbols-outlined text-primary">person_edit</Link>
        <button className="material-symbols-outlined text-primary">shopping_basket</button>
      </div>
    </div>
  );
}
