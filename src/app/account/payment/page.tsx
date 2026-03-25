"use client";

export default function PaymentPage() {
  return (
    <>
      <header className="mb-16">
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-headline font-black tracking-tighter leading-tight text-primary uppercase">
          Payment <span className="bg-secondary-container px-4">Methods</span>
        </h1>
        <p className="font-body text-xl text-zinc-500 mt-6 max-w-xl">
          Your financial coordinates for the weekly ritual exchange.
        </p>
      </header>

      {/* Saved Cards */}
      <section className="mb-16">
        <h2 className="font-headline font-black text-xl uppercase tracking-widest mb-8">Saved Cards</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-surface-container-lowest p-6 border-l-4 border-primary">
            <div className="flex items-center gap-6">
              <div className="w-16 h-10 bg-zinc-800 rounded flex items-center justify-center">
                <span className="text-white font-headline font-bold text-xs">VISA</span>
              </div>
              <div>
                <p className="font-headline font-bold text-lg">**** **** **** 4242</p>
                <p className="font-body text-sm text-zinc-500 mt-1">Expires 12/28</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-secondary-container text-on-secondary-container px-3 py-1 font-headline font-bold text-xs uppercase tracking-widest">Default</span>
              <button type="button" className="material-symbols-outlined text-zinc-400 hover:text-primary">edit</button>
              <button type="button" className="material-symbols-outlined text-zinc-400 hover:text-error">delete</button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-surface-container-lowest p-6 border-l-4 border-outline-variant">
            <div className="flex items-center gap-6">
              <div className="w-16 h-10 bg-red-700 rounded flex items-center justify-center">
                <span className="text-white font-headline font-bold text-xs">MC</span>
              </div>
              <div>
                <p className="font-headline font-bold text-lg">**** **** **** 8888</p>
                <p className="font-body text-sm text-zinc-500 mt-1">Expires 06/27</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button type="button" className="font-headline font-bold text-xs uppercase tracking-widest text-primary hover:underline">Set Default</button>
              <button type="button" className="material-symbols-outlined text-zinc-400 hover:text-primary">edit</button>
              <button type="button" className="material-symbols-outlined text-zinc-400 hover:text-error">delete</button>
            </div>
          </div>
        </div>

        <button type="button" className="mt-6 flex items-center gap-2 text-primary font-headline font-bold text-sm uppercase tracking-widest">
          <span className="material-symbols-outlined">add</span>
          Add New Card
        </button>
      </section>

      {/* Billing Info */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-4">
          <span className="font-headline font-bold text-3xl text-primary-dim block mb-2">01</span>
          <h3 className="font-headline font-black text-xl uppercase tracking-widest">Billing Details</h3>
          <p className="text-sm text-zinc-500 mt-2">For invoice generation.</p>
        </div>
        <div className="lg:col-span-8 grid grid-cols-1 gap-6 bg-surface-container-lowest p-8 shadow-[12px_12px_0px_0px_#56588310]">
          <div className="flex flex-col gap-2">
            <label htmlFor="billingName" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Billing Name</label>
            <input id="billingName" className="bg-surface-container-high border-none py-4 px-6 font-body text-lg" placeholder="Arjun Malhotra" type="text" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="gstNumber" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">GST Number (Optional)</label>
            <input id="gstNumber" className="bg-surface-container-high border-none py-4 px-6 font-body text-lg" placeholder="06AABCU9603R1ZM" type="text" />
          </div>
        </div>
      </section>
    </>
  );
}
