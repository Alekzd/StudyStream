// app/(auth)/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-100 mb-2">
            📹 StudyStream OS
          </h1>
          <p className="text-neutral-400 text-sm">
            Join thousands of students in virtual focus rooms.
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
