import Navbar from "@/components/Navbar";

export default function GiftingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-6xl md:text-8xl font-headline font-black uppercase text-primary leading-none">The Gifting Door</h1>
          <p className="mt-6 text-xl max-w-2xl font-medium text-primary-dim uppercase tracking-wider">
            Create a bespoke creative reset for someone else. Build the experience step-by-step.
          </p>
        </header>

        {/* Builder Flow */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Step 1: Select the Flowers */}
          <section className="md:col-span-8 bg-surface-container-lowest p-8 md:p-12 relative overflow-hidden">
            <div className="relative z-10">
              <span className="font-headline uppercase tracking-[0.1em] text-primary/60 block mb-4">Step 01</span>
              <h2 className="text-4xl font-black uppercase mb-12">Select the Flowers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* The Solo */}
                <div className="border-2 border-primary p-6 hover:bg-secondary-container transition-colors cursor-pointer flex flex-col justify-between aspect-[3/4]">
                  <div>
                    <h3 className="text-2xl font-bold uppercase">The Solo</h3>
                    <p className="text-sm mt-2 font-medium opacity-70 uppercase tracking-tight">12-15 Stems. Perfect for a desk reset.</p>
                  </div>
                  <span className="text-3xl font-black mt-auto">$45</span>
                </div>

                {/* The Studio (Selected) */}
                <div className="bg-secondary-container p-6 border-2 border-primary cursor-pointer flex flex-col justify-between aspect-[3/4]">
                  <div>
                    <h3 className="text-2xl font-bold uppercase italic">The Studio</h3>
                    <p className="text-sm mt-2 font-medium opacity-70 uppercase tracking-tight">24-30 Stems. Our signature volume.</p>
                  </div>
                  <span className="text-3xl font-black mt-auto">$85</span>
                </div>

                {/* The Gallery */}
                <div className="border-2 border-primary p-6 hover:bg-secondary-container transition-colors cursor-pointer flex flex-col justify-between aspect-[3/4]">
                  <div>
                    <h3 className="text-2xl font-bold uppercase">The Gallery</h3>
                    <p className="text-sm mt-2 font-medium opacity-70 uppercase tracking-tight">40+ Stems. For the master florist.</p>
                  </div>
                  <span className="text-3xl font-black mt-auto">$120</span>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Select the Mood */}
          <section className="md:col-span-4 bg-primary text-on-primary p-8 md:p-10 flex flex-col justify-between">
            <div>
              <span className="font-headline uppercase tracking-[0.1em] text-on-primary/60 block mb-4">Step 02</span>
              <h2 className="text-4xl font-black uppercase mb-8 leading-tight">Select the Mood</h2>
              <div className="space-y-4">
                <button className="w-full text-left p-5 border border-on-primary/20 hover:bg-secondary-container hover:text-on-secondary-container transition-all flex items-center justify-between">
                  <span className="uppercase font-bold tracking-widest text-lg">Sunday Morning</span>
                  <span className="material-symbols-outlined">play_circle</span>
                </button>
                <button className="w-full text-left p-5 border border-on-primary/20 hover:bg-secondary-container hover:text-on-secondary-container transition-all flex items-center justify-between">
                  <span className="uppercase font-bold tracking-widest text-lg">Energy Boost</span>
                  <span className="material-symbols-outlined">bolt</span>
                </button>
                <button className="w-full text-left p-5 border border-on-primary/20 bg-secondary-container text-on-secondary-container transition-all flex items-center justify-between">
                  <span className="uppercase font-bold tracking-widest text-lg italic">Chill Lo-Fi</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
                </button>
              </div>
            </div>
            <p className="mt-8 text-xs uppercase tracking-widest opacity-60">A curated QR code will be tucked into the box lid.</p>
          </section>

          {/* Step 3: Personal Touch */}
          <section className="md:col-span-12 lg:col-span-7 bg-surface-container p-8 md:p-12">
            <span className="font-headline uppercase tracking-[0.1em] text-primary/60 block mb-4">Step 03</span>
            <h2 className="text-4xl font-black uppercase mb-8">The Personal Touch</h2>
            <div className="space-y-6">
              <div>
                <label className="uppercase tracking-[0.1em] block mb-3 text-primary font-bold">Your Message (Handwritten by us)</label>
                <textarea 
                  className="w-full bg-surface-container-lowest border-none focus:ring-2 focus:ring-secondary-container p-6 text-xl font-medium uppercase tracking-tight placeholder:opacity-20" 
                  placeholder="TYPE YOUR NOTE HERE..." 
                  rows={6}
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-lowest border border-outline-variant/15 flex items-center gap-4 cursor-pointer">
                  <input className="w-6 h-6 rounded-none border-2 border-primary accent-secondary-container" type="checkbox" />
                  <span className="uppercase font-bold text-primary">Anonymous Sender</span>
                </div>
                <div className="p-4 bg-surface-container-lowest border border-outline-variant/15 flex items-center gap-4 cursor-pointer">
                  <input className="w-6 h-6 rounded-none border-2 border-primary accent-secondary-container" type="checkbox" defaultChecked />
                  <span className="uppercase font-bold text-primary">Eco-Packaging Only</span>
                </div>
              </div>
            </div>
          </section>

          {/* Summary / Checkout */}
          <section className="md:col-span-12 lg:col-span-5 bg-secondary-container p-8 md:p-12 flex flex-col">
            <h2 className="text-3xl font-black uppercase mb-8 text-on-secondary-container">Your Experience</h2>
            <div className="flex-grow space-y-6 border-t-2 border-on-secondary-container/20 pt-6">
              <div className="flex justify-between items-end">
                <span className="uppercase font-medium text-sm tracking-widest opacity-60">Item</span>
                <span className="uppercase font-bold text-lg">The Studio Box</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="uppercase font-medium text-sm tracking-widest opacity-60">Mood</span>
                <span className="uppercase font-bold text-lg">Chill Lo-Fi</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="uppercase font-medium text-sm tracking-widest opacity-60">Personal Touch</span>
                <span className="uppercase font-bold text-lg">Included</span>
              </div>
              <div className="pt-6 border-t-2 border-on-secondary-container mt-6">
                <div className="flex justify-between items-baseline">
                  <span className="font-black uppercase text-2xl">Total</span>
                  <span className="font-black text-4xl">$85.00</span>
                </div>
              </div>
            </div>
            <button className="w-full mt-12 bg-primary text-on-primary py-6 text-2xl font-black uppercase tracking-tighter hover:translate-x-1 hover:-translate-y-1 transition-transform relative group">
              <span className="relative z-10">Send the Door</span>
            </button>
          </section>
        </div>

        {/* Featured Section */}
        <div className="mt-20 bg-primary-container p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
            <div>
              <h3 className="text-5xl font-black uppercase text-on-primary-container mb-6">The Unboxing Ritual</h3>
              <p className="text-lg font-medium text-on-primary-container/80 uppercase leading-relaxed">
                Every gift is packed in our sustainable signature sleeve. We include flower food, a guide to "The Reset", and the custom mood QR code. It's more than flowers; it's a creative pause.
              </p>
            </div>
            <div className="relative h-64 md:h-96 flex items-center justify-center">
              <div className="w-64 h-64 bg-white shadow-2xl rotate-3 flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-primary">inventory_2</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container py-12 px-8 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <div className="font-headline font-bold text-primary text-3xl mb-4 uppercase">THE TULIP DOOR</div>
            <p className="font-body font-medium uppercase tracking-[0.1em] text-sm text-primary/60">
              ©2024 THE TULIP DOOR. YOUR WEEKLY CREATIVE RESET.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <a href="#" className="font-body font-medium uppercase tracking-[0.1em] text-sm text-primary/60 hover:text-secondary-container transition-colors">The Process</a>
            <a href="#" className="font-body font-medium uppercase tracking-[0.1em] text-sm text-primary/60 hover:text-secondary-container transition-colors">Sustainability</a>
            <a href="#" className="font-body font-medium uppercase tracking-[0.1em] text-sm text-primary/60 hover:text-secondary-container transition-colors">Support</a>
            <a href="#" className="font-body font-medium uppercase tracking-[0.1em] text-sm text-primary/60 hover:text-secondary-container transition-colors">Shipping</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
