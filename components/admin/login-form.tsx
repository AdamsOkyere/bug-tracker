"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const data = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
      callbackUrl: "/admin",
    });

    if (result?.ok) {
      toast.success("Signed in");
      router.push("/admin");
      router.refresh();
    } else {
      toast.error("Email or password is incorrect.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={submit}>
      <div>
        <label className="mb-2 block text-sm font-bold" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="username"
          className="w-full rounded-md border border-ink/20 bg-white/70 px-4 py-3 text-sm focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="w-full rounded-md border border-ink/20 bg-white/70 px-4 py-3 text-sm focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>
      <button
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-bold text-white transition hover:bg-moss disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <LoaderCircle
            aria-label="Signing in"
            className="animate-spin"
            size={17}
          />
        ) : (
          <>
            Sign in <ArrowRight aria-hidden="true" size={16} />
          </>
        )}
      </button>
    </form>
  );
}
