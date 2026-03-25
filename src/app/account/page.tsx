"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function AccountPage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: "",
      });
      setLoading(false);
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Profile updated successfully" });
        await updateSession();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="material-symbols-outlined text-primary animate-spin">sync</span>
      </div>
    );
  }

  return (
    <>
      <header className="mb-16">
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-headline font-black tracking-tighter leading-tight text-primary uppercase">
          Edit Your <br /> <span className="bg-secondary-container px-4">Ritual Details</span>
        </h1>
        <p className="font-body text-xl text-zinc-500 mt-6 max-w-xl">
          Configure your digital presence and physical coordinates for the next floral drop.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-12 max-w-5xl">
        {message.text && (
          <div className={`p-4 font-medium text-sm ${
            message.type === "success" 
              ? "bg-green-100 text-green-800" 
              : "bg-error-container text-on-error-container"
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4">
            <span className="font-headline font-bold text-3xl text-primary-dim block mb-2">01</span>
            <h3 className="font-headline font-black text-xl uppercase tracking-widest">Profile Identity</h3>
            <p className="text-sm text-zinc-500 mt-2">How we recognize you in the Greenhouse.</p>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-lowest p-8 shadow-[12px_12px_0px_0px_#56588310]">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="bg-surface-container-high border-none py-4 px-6 font-body text-lg"
                placeholder="Arjun Malhotra"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-surface-container-highest border-none py-4 px-6 font-body text-lg text-zinc-400 cursor-not-allowed"
                placeholder="arjun@thetulipdoor.com"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label htmlFor="phone" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="bg-surface-container-high border-none py-4 px-6 font-body text-lg"
                placeholder="+91 98XXX XXXXX"
              />
            </div>
          </div>
        </section>

        {/* CTA Actions */}
        <section className="flex flex-col md:flex-row items-center justify-end gap-8 mt-12 py-12 border-t border-primary/10">
          <button 
            type="button"
            onClick={() => window.location.reload()}
            className="font-headline font-bold text-[12px] uppercase tracking-[0.2em] text-primary hover:underline"
          >
            Cancel Changes
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="relative bg-secondary-container text-on-secondary-container font-headline font-black uppercase text-xl px-12 py-6 group transition-all disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-primary -z-10 translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform"></div>
            {saving ? "Saving..." : "Update Account"}
          </button>
        </section>
      </form>

      <div className="mt-32 opacity-10 pointer-events-none select-none">
        <h4 className="text-[12rem] font-headline font-black leading-none -tracking-widest text-primary uppercase">Tulip Door</h4>
      </div>
    </>
  );
}
