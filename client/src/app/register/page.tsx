"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }

      login(data.token, data.user);
      router.push("/");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Register</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <input
          className="border rounded px-3 py-2 text-sm"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
          required
        />
        <input
          className="border rounded px-3 py-2 text-sm"
          type="password"
          placeholder="Password (min 6 chars)"
          value={formData.password}
          onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
          required
        />
        <button
          className="bg-black text-white py-2 rounded text-sm disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <p className="text-sm text-center">
          Have an account?{" "}
          <a href="/login" className="underline">
            Login
          </a>
        </p>
      </form>
    </main>
  );
}
