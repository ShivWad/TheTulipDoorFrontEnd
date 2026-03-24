import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row items-stretch overflow-hidden min-h-[calc(100vh-6rem)]">
          <div className="w-full md:w-7/12 p-8 md:p-20 flex flex-col justify-center bg-surface-container-lowest">
            <span className="font-headline text-sm uppercase tracking-[0.2em] mb-6 text-primary">Volume 01: The Launch</span>
            <h1 className="text-7xl md:text-9xl font-black leading-[0.85] tracking-tighter text-primary mb-12">
              YOUR WEEKLY<br />CREATIVE<br /><span className="text-secondary-container">RESET.</span>
            </h1>
            <p className="text-xl md:text-2xl font-medium leading-relaxed text-on-surface-variant max-w-xl mb-12">
              A subscription for the tactile. 10 minutes of intentional living delivered to your door in a periwinkle box.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-secondary-container text-on-secondary-container px-10 py-6 font-headline font-bold uppercase tracking-widest text-lg hover:translate-x-1 hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_0px_rgba(86,88,131,1)]">
                Start the Ritual
              </button>
            </div>
          </div>
          <div className="w-full md:w-5/12 bg-primary-container relative min-h-[500px] flex items-center justify-center overflow-hidden">
            <div className="relative z-10 w-4/5 aspect-square bg-white shadow-2xl p-1 shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="w-full h-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-white">local_florist</span>
              </div>
            </div>
          </div>
        </section>

        {/* The Ritual Steps */}
        <section className="py-32 px-8 max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-primary tracking-tighter uppercase mb-4">How the Ritual Works</h2>
            <div className="h-2 w-32 bg-secondary-container"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-surface-container-low p-12 flex flex-col justify-between aspect-square group hover:bg-primary transition-colors duration-300">
              <div>
                <span className="font-headline text-8xl font-black opacity-10 group-hover:text-white transition-colors">01</span>
                <h3 className="text-3xl font-bold uppercase tracking-tight mt-[-2rem] group-hover:text-secondary-container transition-colors">Scan</h3>
                <p className="mt-6 font-body text-lg group-hover:text-white transition-colors">Unbox your stems and scan the geometric QR code on the inner lid to unlock this week's atmosphere.</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary group-hover:text-secondary-container transition-colors">qr_code_2</span>
            </div>

            {/* Step 2 */}
            <div className="bg-secondary-container p-12 flex flex-col justify-between aspect-square shadow-[12px_12px_0px_0px_rgba(86,88,131,1)]">
              <div>
                <span className="font-headline text-8xl font-black opacity-10">02</span>
                <h3 className="text-3xl font-bold uppercase tracking-tight mt-[-2rem]">Play</h3>
                <p className="mt-6 font-body text-lg">Immerse yourself in a curated 10-minute soundscape, mood-matched to the specific hues of your stems.</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-on-secondary-container">graphic_eq</span>
            </div>

            {/* Step 3 */}
            <div className="bg-surface-container-low p-12 flex flex-col justify-between aspect-square group hover:bg-primary transition-colors duration-300">
              <div>
                <span className="font-headline text-8xl font-black opacity-10 group-hover:text-white transition-colors">03</span>
                <h3 className="text-3xl font-bold uppercase tracking-tight mt-[-2rem] group-hover:text-secondary-container transition-colors">Reset</h3>
                <p className="mt-6 font-body text-lg group-hover:text-white transition-colors">Follow our 3-step floral guide. Arrange. Breathe. Return to yourself.</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary group-hover:text-secondary-container transition-colors">spa</span>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 px-8 bg-surface-container">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-black text-primary tracking-tighter uppercase mb-12">Choose Your Reset</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Solo */}
              <div className="border-2 border-primary p-8 hover:bg-secondary-container transition-colors cursor-pointer">
                <h3 className="text-3xl font-bold uppercase mb-4">The Solo</h3>
                <p className="text-lg font-medium opacity-70 uppercase tracking-tight mb-6">12-15 Stems. Perfect for a desk reset.</p>
                <span className="text-4xl font-black">$45<span className="text-lg font-normal">/week</span></span>
              </div>

              {/* Studio */}
              <div className="bg-secondary-container p-8 border-2 border-primary cursor-pointer">
                <h3 className="text-3xl font-bold uppercase mb-4">The Studio</h3>
                <p className="text-lg font-medium opacity-70 uppercase tracking-tight mb-6">24-30 Stems. Our signature volume.</p>
                <span className="text-4xl font-black">$85<span className="text-lg font-normal">/week</span></span>
              </div>

              {/* Gallery */}
              <div className="border-2 border-primary p-8 hover:bg-secondary-container transition-colors cursor-pointer">
                <h3 className="text-3xl font-bold uppercase mb-4">The Gallery</h3>
                <p className="text-lg font-medium opacity-70 uppercase tracking-tight mb-6">40+ Stems. For the master florist.</p>
                <span className="text-4xl font-black">$120<span className="text-lg font-normal">/week</span></span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-8 text-center">
          <h2 className="text-5xl md:text-7xl font-black text-primary tracking-tighter uppercase mb-8">
            Begin Your Ritual
          </h2>
          <p className="text-xl font-medium text-on-surface-variant max-w-2xl mx-auto mb-12">
            Join thousands who have discovered the joy of weekly creative resets.
          </p>
          <button className="bg-primary text-on-primary px-12 py-6 font-headline font-bold uppercase tracking-widest text-lg hover:translate-x-1 hover:-translate-y-1 transition-transform">
            Subscribe Now
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <div className="font-headline font-bold text-primary text-3xl mb-4 uppercase">THE TULIP DOOR</div>
            <p className="font-body font-medium uppercase tracking-[0.1em] text-sm text-primary/60">
              ©2024 THE TULIP DOOR. YOUR WEEKLY CREATIVE RESET.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Link href="#" className="font-body font-medium uppercase tracking-[0.1em] text-sm text-primary/60 hover:text-secondary-container transition-colors">The Process</Link>
            <Link href="#" className="font-body font-medium uppercase tracking-[0.1em] text-sm text-primary/60 hover:text-secondary-container transition-colors">Sustainability</Link>
            <Link href="#" className="font-body font-medium uppercase tracking-[0.1em] text-sm text-primary/60 hover:text-secondary-container transition-colors">Support</Link>
            <Link href="#" className="font-body font-medium uppercase tracking-[0.1em] text-sm text-primary/60 hover:text-secondary-container transition-colors">Shipping</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
