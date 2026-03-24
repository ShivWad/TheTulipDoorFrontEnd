import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full bg-white/10 backdrop-blur-xl flex justify-between items-center px-8 py-6">
      <Link href="/" className="text-3xl font-black tracking-[-0.05em] text-primary font-headline uppercase hover:opacity-80 transition-opacity">
        THE TULIP DOOR
      </Link>
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
      <div className="flex gap-6 items-center">
        <button className="material-symbols-outlined text-primary hover:translate-x-1 hover:-translate-y-1 transition-transform duration-200">shopping_cart</button>
        <Link href="/account" className="material-symbols-outlined text-primary hover:translate-x-1 hover:-translate-y-1 transition-transform duration-200">person</Link>
      </div>
    </nav>
  );
}
