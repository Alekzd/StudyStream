import { SignUp } from "@clerk/nextjs";
import { AppIcon } from "@/components/ui/Icon";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-espresso-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-espresso-850 border border-brass-500/20 flex items-center justify-center shadow-lg mb-3">
            <AppIcon name="coffee" size={24} className="text-brass-400" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-crema-100 mb-1">
            StudyStream
          </h1>
          <p className="text-crema-500 text-xs tracking-wide">
            Join thousands of students in virtual focus rooms.
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
