// app/(main)/page.tsx
// StudyStream OS — Dashboard / Home (redirect to explore or first server)

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Redirect to explore page by default
  redirect("/explore");
}
