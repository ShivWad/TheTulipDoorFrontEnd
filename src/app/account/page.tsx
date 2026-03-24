export default function AccountPage() {
  return (
    <>
      <header className="mb-16">
        <h1 className="text-6xl md:text-8xl font-headline font-black tracking-tighter leading-tight text-primary uppercase">
          Edit Your <br /> <span className="bg-secondary-container px-4">Ritual Details</span>
        </h1>
        <p className="font-body text-xl text-zinc-500 mt-6 max-w-xl">
          Configure your digital presence and physical coordinates for the next floral drop.
        </p>
      </header>

      <form className="flex flex-col gap-12 max-w-5xl">
        {/* Profile Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4">
            <span className="font-headline font-bold text-3xl text-primary-dim block mb-2">01</span>
            <h3 className="font-headline font-black text-xl uppercase tracking-widest">Profile Identity</h3>
            <p className="text-sm text-zinc-500 mt-2">How we recognize you in the Greenhouse.</p>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-lowest p-8 shadow-[12px_12px_0px_0px_#56588310]">
            <div className="flex flex-col gap-2">
              <label className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Full Name</label>
              <input className="bg-surface-container-high border-none py-4 px-6 font-body text-lg" placeholder="Arjun Malhotra" type="text" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Email Address</label>
              <input className="bg-surface-container-high border-none py-4 px-6 font-body text-lg" placeholder="arjun@thetulipdoor.com" type="email" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Phone Number</label>
              <input className="bg-surface-container-high border-none py-4 px-6 font-body text-lg" placeholder="+91 98XXX XXXXX" type="tel" />
            </div>
          </div>
        </section>

        {/* Shipping Address Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4">
            <span className="font-headline font-bold text-3xl text-primary-dim block mb-2">02</span>
            <h3 className="font-headline font-black text-xl uppercase tracking-widest">Physical Coordinates</h3>
            <p className="text-sm text-zinc-500 mt-2">Delivery focus: NCR Cluster (Gurugram/Delhi).</p>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-lowest p-8 shadow-[12px_12px_0px_0px_#56588310]">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Street Address</label>
              <input className="bg-surface-container-high border-none py-4 px-6 font-body text-lg" placeholder="Plot 44, Golf Course Extension Road" type="text" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Apartment / Suite</label>
              <input className="bg-surface-container-high border-none py-4 px-6 font-body text-lg" placeholder="Tower B, Penthouse 4" type="text" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">City</label>
              <input className="bg-surface-container-high border-none py-4 px-6 font-body text-lg" placeholder="Gurugram" type="text" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Pincode</label>
              <input className="bg-surface-container-high border-none py-4 px-6 font-body text-lg" placeholder="122001" type="text" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">State</label>
              <input className="bg-surface-container-highest border-none py-4 px-6 font-body text-lg text-zinc-400" disabled placeholder="Haryana" type="text" value="Haryana" />
            </div>
          </div>
        </section>

        {/* CTA Actions */}
        <section className="flex flex-col md:flex-row items-center justify-end gap-8 mt-12 py-12 border-t border-primary/10">
          <button className="font-headline font-bold text-[12px] uppercase tracking-[0.2em] text-primary hover:underline" type="button">
            Cancel Changes
          </button>
          <button className="relative bg-secondary-container text-on-secondary-container font-headline font-black uppercase text-xl px-12 py-6 group transition-all" type="submit">
            <div className="absolute inset-0 bg-primary -z-10 translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2"></div>
            Update Account
          </button>
        </section>
      </form>

      <div className="mt-32 opacity-10 pointer-events-none select-none">
        <h4 className="text-[12rem] font-headline font-black leading-none -tracking-widest text-primary uppercase">Tulip Door</h4>
      </div>
    </>
  );
}
