"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created but couldn't sign in automatically");
      } else {
        router.push("/account");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <nav className="fixed top-0 z-50 w-full bg-white/10 backdrop-blur-xl flex justify-between items-center px-8 py-6">
        <Link href="/" className="text-3xl font-black tracking-[-0.05em] text-primary font-headline uppercase hover:opacity-80 transition-opacity">
          THE TULIP DOOR
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-primary uppercase font-headline">
              Join the <span className="bg-secondary-container px-2">Ritual</span>
            </h1>
            <p className="font-body text-lg text-on-surface-variant mt-4">
              Create your account to begin your weekly reset
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(86,88,131,0.1)]">
            {error && (
              <div className="bg-error-container text-on-error-container p-4 mb-6 font-medium text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400 block mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border-none py-4 px-6 font-body text-lg focus:ring-2 focus:ring-secondary-container"
                  placeholder="Arjun Malhotra"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400 block mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border-none py-4 px-6 font-body text-lg focus:ring-2 focus:ring-secondary-container"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400 block mb-2">
                  Phone Number <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border-none py-4 px-6 font-body text-lg focus:ring-2 focus:ring-secondary-container"
                  placeholder="+91 98XXX XXXXX"
                />
              </div>

              <div>
                <label htmlFor="password" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400 block mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border-none py-4 px-6 font-body text-lg focus:ring-2 focus:ring-secondary-container"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400 block mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border-none py-4 px-6 font-body text-lg focus:ring-2 focus:ring-secondary-container"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-secondary-container text-on-secondary-container font-headline font-black uppercase text-xl px-8 py-5 group transition-all disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              <div className="absolute inset-0 bg-primary -z-10 translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform"></div>
              {loading ? "Creating Account..." : "Begin Your Ritual"}
            </button>
          </form>

          <p className="text-center mt-8 font-body text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>

      <footer className="bg-surface-container py-8 px-8 text-center">
        <p className="font-body font-medium uppercase tracking-[0.1em] text-sm text-primary/60">
          ©2026 THE TULIP DOOR. YOUR WEEKLY CREATIVE RESET.
        </p>
      </footer>
    </div>
  );
}
