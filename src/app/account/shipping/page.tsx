export default function ShippingPage() {
  return (
    <>
      <header className="mb-16">
        <h1 className="text-6xl md:text-8xl font-headline font-black tracking-tighter leading-tight text-primary uppercase">
          Shipping <span className="bg-secondary-container px-4">Addresses</span>
        </h1>
        <p className="font-body text-xl text-zinc-500 mt-6 max-w-xl">
          Your physical coordinates. Where the ritual arrives.
        </p>
      </header>

      {/* Saved Addresses */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Primary Address */}
          <div className="bg-surface-container-lowest p-8 border-l-4 border-secondary-container">
            <div className="flex justify-between items-start mb-6">
              <span className="bg-secondary-container text-on-secondary-container px-3 py-1 font-headline font-bold text-xs uppercase tracking-widest">Default</span>
              <div className="flex gap-2">
                <button className="material-symbols-outlined text-zinc-400 hover:text-primary">edit</button>
                <button className="material-symbols-outlined text-zinc-400 hover:text-error">delete</button>
              </div>
            </div>
            <p className="font-headline font-bold text-lg uppercase mb-2">Home</p>
            <p className="font-body text-zinc-600 leading-relaxed">
              Arjun Malhotra<br />
              Plot 44, Golf Course Extension Road<br />
              Tower B, Penthouse 4<br />
              Gurugram, Haryana 122001<br />
              +91 98XXX XXXXX
            </p>
          </div>

          {/* Secondary Address */}
          <div className="bg-surface-container-lowest p-8 border-l-4 border-outline-variant">
            <div className="flex justify-between items-start mb-6">
              <span className="text-zinc-400 font-headline font-bold text-xs uppercase tracking-widest">Work</span>
              <div className="flex gap-2">
                <button className="material-symbols-outlined text-zinc-400 hover:text-primary">edit</button>
                <button className="material-symbols-outlined text-zinc-400 hover:text-error">delete</button>
              </div>
            </div>
            <p className="font-headline font-bold text-lg uppercase mb-2">Office</p>
            <p className="font-body text-zinc-600 leading-relaxed">
              Arjun Malhotra<br />
              Building 8, Cyber City<br />
              Floor 12, Suite 1204<br />
              Gurugram, Haryana 122002<br />
              +91 98XXX XXXXX
            </p>
          </div>
        </div>

        <button className="mt-8 flex items-center gap-2 text-primary font-headline font-bold text-sm uppercase tracking-widest">
          <span className="material-symbols-outlined">add</span>
          Add New Address
        </button>
      </section>

      {/* Delivery Preferences */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-4">
          <span className="font-headline font-bold text-3xl text-primary-dim block mb-2">01</span>
          <h3 className="font-headline font-black text-xl uppercase tracking-widest">Delivery Preferences</h3>
          <p className="text-sm text-zinc-500 mt-2">How we hand over the ritual.</p>
        </div>
        <div className="lg:col-span-8 grid grid-cols-1 gap-6 bg-surface-container-lowest p-8 shadow-[12px_12px_0px_0px_#56588310]">
          <div className="flex flex-col gap-2">
            <label className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Preferred Time Slot</label>
            <select className="bg-surface-container-high border-none py-4 px-6 font-body text-lg">
              <option>Morning (9:00 AM - 12:00 PM)</option>
              <option>Afternoon (12:00 PM - 3:00 PM)</option>
              <option>Evening (3:00 PM - 7:00 PM)</option>
            </select>
          </div>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5 accent-primary" defaultChecked />
              <span className="font-body text-lg">Leave at door / reception</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5 accent-primary" />
              <span className="font-body text-lg">Ring bell on arrival</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5 accent-primary" />
              <span className="font-body text-lg">SMS/Call on arrival</span>
            </label>
          </div>
        </div>
      </section>
    </>
  );
}
