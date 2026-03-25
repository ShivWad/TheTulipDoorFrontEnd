"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
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
              Welcome <span className="bg-secondary-container px-2">Back</span>
            </h1>
            <p className="font-body text-lg text-on-surface-variant mt-4">
              Sign in to access your ritual details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(86,88,131,0.1)]">
            {error && (
              <div className="bg-error-container text-on-error-container p-4 mb-6 font-medium text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400 block mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-high border-none py-4 px-6 font-body text-lg focus:ring-2 focus:ring-secondary-container"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400 block mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Signing In..." : "Enter the Door"}
            </button>
          </form>

          <p className="text-center mt-8 font-body text-on-surface-variant">
            New to The Tulip Door?{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Create Account
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
