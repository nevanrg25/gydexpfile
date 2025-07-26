import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { EchoAidDashboard } from "./components/EchoAidDashboard";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            EchoAid
          </h2>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          EchoAid
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          AI-Powered Voice-First Platform for Social Welfare Access
        </p>
        <p className="text-lg text-gray-500">
          Connecting digitally excluded populations to essential services through voice
        </p>
        
        <Authenticated>
          <div className="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-lg border">
            <p className="text-lg text-gray-700">
              Welcome back, {loggedInUser?.email ?? "Administrator"}!
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Access the EchoAid management dashboard below
            </p>
          </div>
        </Authenticated>
        
        <Unauthenticated>
          <div className="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-lg border">
            <p className="text-lg text-gray-700">
              Sign in to access the EchoAid management dashboard
            </p>
          </div>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <div className="max-w-md mx-auto">
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        <EchoAidDashboard />
      </Authenticated>
    </div>
  );
}
