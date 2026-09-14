// app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-100 mb-2">
            📹 StudyStream OS
          </h1>
          <p className="text-neutral-400 text-sm">
            Alone. But never lonely. Study together. Focus together.
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
