import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Validate code format: should be 8 hex chars
  if (/^[a-f0-9]{8}$/i.test(code)) {
    const cookieStore = await cookies();
    cookieStore.set("mat_ref", code, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  redirect("/signup");
}
