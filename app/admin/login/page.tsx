import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-10">
      <section className="w-full max-w-md">
        <a className="flex items-center gap-2.5" href="/">
          <span className="flex size-8 items-center justify-center rounded-sm bg-ink font-display text-sm text-paper">
            F
          </span>
          <span className="font-display text-lg">Fieldnote</span>
        </a>
        <div className="mt-12 border-t border-ink/15 pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-moss">
            Team access
          </p>
          <h1 className="mt-3 font-display text-4xl">Welcome back.</h1>
          <p className="mt-3 text-sm leading-6 text-ink/60">
            Sign in to review the notes coming in.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
