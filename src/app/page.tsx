'use client';

import { ArrowRight, Sparkles, Database, MessageSquare, FileText, Activity, BrainCircuit } from 'lucide-react';
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import {
  ScrollReveal,
  DashboardCard,
  SourceRetrievalCard,
  AIAnalysisCard,
  LiveChatCard,
  CitationCard,
  SummaryCard,
  ImpactSection,
  OrbitalTeamSection,
  AgentStatsSection,
  PricingSection,
} from "@/components/landing";

export default function LandingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Get patient data for logged-in users
  const patient = useQuery(api.patients.getMyPatient);
  const createChatMutation = useMutation(api.chats.createChat);
  const sendMessageMutation = useMutation(api.chats.sendMessage);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    // Show loading state
    setIsLoading(true);

    try {
      if (isSignedIn) {
        // User is logged in
        if (patient) {
          // User has a patient record - create a new chat and redirect
          const messageContent = prompt.trim();
          const title = messageContent.length > 40
            ? messageContent.substring(0, 40) + '...'
            : messageContent;

          const newChatId = await createChatMutation({
            patientId: patient._id,
            title: title,
          });

          // Save the user's message to the chat
          await sendMessageMutation({
            chatId: newChatId,
            role: "user",
            content: messageContent,
          });

          // Redirect to the new chat with the prompt as a pending query
          router.push(`/dashboard/chat/${newChatId}?pending=${encodeURIComponent(messageContent)}`);
        } else if (patient === null) {
          // User is logged in but has no patient record - save prompt and redirect to onboarding
          localStorage.setItem('pendingPrompt', prompt.trim());
          router.push('/onboarding');
        } else {
          // Patient data is still loading (undefined) - wait a bit and retry
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
        }
      } else {
        // User is not logged in - save prompt to localStorage and show signup modal
        localStorage.setItem('pendingPrompt', prompt.trim());
        setTimeout(() => {
          setIsLoading(false);
          setShowSignup(true);
        }, 800);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <>
      <style>{`
        @font-face {
          font-family: 'Kalice Regular';
          src: local('Kalice Regular'), local('Kalice-Regular');
        }
        * {
          font-family: "Kalice Regular", "Inter", sans-serif !important;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 1; scale: 1; }
          50% { opacity: 0.7; scale: 0.9; }
        }
        @keyframes dust-float {
          0% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-10px) translateX(5px); }
          66% { transform: translateY(5px) translateX(-5px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        .animate-dust-float {
          animation-name: dust-float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>

      <div className="bg-slate-50 dark:bg-black min-h-screen text-slate-900 dark:text-white overflow-x-hidden relative">

        {/* --- HERO SECTION --- */}
        <div className="relative w-full min-h-[95vh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-black dark:via-zinc-900 dark:to-indigo-950 flex flex-col overflow-hidden z-20">

          {/* Background Decoration */}
          <div className="absolute top-[18%] md:top-[12%] lg:top-[20%] left-1/2 -translate-x-1/2 w-[120vw] h-[120vw] rounded-[100%] border-[1px] border-indigo-200/50 dark:border-white/10 pointer-events-none"></div>
          <div className="absolute top-[19%] md:top-[13%] lg:top-[21%] left-[48%] -translate-x-1/2 w-[118vw] h-[118vw] rounded-[100%] border-[1px] border-blue-200/30 dark:border-white/5 pointer-events-none"></div>
          <div className="absolute top-[23%] md:top-[17%] lg:top-[25%] left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-300/30 dark:bg-indigo-500/30 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Glowing Star */}
          <div className="absolute top-[calc(18%-1px)] md:top-[calc(12%-1px)] lg:top-[calc(20%-1px)] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="relative flex items-center justify-center animate-twinkle">
              <Sparkles className="text-indigo-500 dark:text-white w-6 h-6 fill-indigo-400 dark:fill-white drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              <div className="absolute inset-0 bg-indigo-400/60 dark:bg-white/60 blur-lg rounded-full scale-125"></div>
              <div className="absolute w-8 h-0.5 bg-indigo-400/50 dark:bg-white/50 blur-[0.5px]"></div>
              <div className="absolute w-0.5 h-8 bg-indigo-400/50 dark:bg-white/50 blur-[0.5px]"></div>
            </div>
          </div>

          {/* Navbar */}
          <nav className="relative z-50 w-full px-8 md:px-16 py-9 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">MedBax</span>
            </div>
            <div className="hidden md:flex items-center gap-12 text-sm font-light tracking-wide text-slate-600 dark:text-zinc-300 absolute left-1/2 -translate-x-1/2">
              <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-opacity">Home</Link>
              <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-opacity">Pricing</Link>
              <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-opacity">About</Link>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
              {isSignedIn ? (
                <Link href="/dashboard/chat">
                  <button className="bg-slate-900 dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors">Dashboard</button>
                </Link>
              ) : (
                <SignInButton mode="modal" forceRedirectUrl="/onboarding">
                  <button className="bg-slate-900 dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors">Sign In</button>
                </SignInButton>
              )}
            </div>
          </nav>

          {/* Hero Text */}
          <main className="relative z-10 w-full px-4 pt-16 md:pt-26 text-center flex-grow flex flex-col items-center">
            <ScrollReveal>
              <h2 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 leading-[1.1] drop-shadow-sm text-slate-900 dark:text-white">Your Complete <br /> Medical Profile</h2>
              <p className="text-lg md:text-xl text-slate-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light">Build your complete medical profile and get personalized health insights. Our RAG-powered AI analyzes your medical history to deliver evidence-based deductions tailored just for you.</p>

              <div className="relative w-full max-w-2xl mx-auto mb-10 group px-4 z-50">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400/30 to-blue-400/30 dark:from-indigo-600/30 dark:to-blue-600/20 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative bg-white dark:bg-white/95 backdrop-blur-xl p-1.5 pl-3 rounded-full border border-slate-200 dark:border-white/50 shadow-2xl flex items-center">
                  <div className="p-1.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 dark:from-blue-900 dark:to-indigo-900 shadow-inner flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/30 blur-sm rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder={isLoading ? "Sending..." : "Ask about your health..."}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="w-full p-2.5 bg-transparent text-lg text-slate-900 dark:text-black placeholder:text-slate-400 border-0 focus:ring-0 outline-none font-medium disabled:opacity-50"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !prompt.trim()}
                    className="bg-indigo-600 dark:bg-black hover:bg-indigo-700 dark:hover:bg-zinc-800 text-white p-2.5 rounded-full transition-all transform hover:scale-105 hover:rotate-12 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0"
                  >
                    {isLoading ? (
                      <div className="animate-spin h-[18px] w-[18px] border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Hidden SignUpButton that triggers when showSignup is true */}
              {showSignup && (
                <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
                  <button className="hidden" ref={(btn) => {
                    if (btn && showSignup) {
                      btn.click();
                      setShowSignup(false);
                      setPrompt('');
                    }
                  }}></button>
                </SignUpButton>
              )}
            </ScrollReveal>
          </main>

          {/* The Fan of Cards (Bottom of Hero) */}
          <div className="relative w-full h-80 mt-auto pointer-events-none z-0 overflow-hidden">
            <div className="relative w-full h-full flex justify-center">
              <div className="absolute bottom-[-10%] left-[5%] md:left-[20%] w-60 transform -rotate-12 translate-y-10 opacity-90 transition-all hover:translate-y-0 hover:z-30 hover:rotate-0 hover:scale-110 pointer-events-auto cursor-pointer duration-500">
                <DashboardCard title="Knowledge Retrieval" icon={Database} className="h-52">
                  <SourceRetrievalCard />
                </DashboardCard>
              </div>
              <div className="absolute bottom-[2%] left-[22%] md:left-[35%] w-56 transform -rotate-6 translate-y-4 z-10 hidden sm:block transition-all hover:translate-y-[-20px] hover:z-30 hover:rotate-0 hover:scale-110 pointer-events-auto cursor-pointer duration-500">
                <DashboardCard title="Clinical Logic" icon={BrainCircuit} className="h-44">
                  <AIAnalysisCard />
                </DashboardCard>
              </div>
              <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-72 transform z-20 shadow-2xl transition-all hover:translate-y-[-10px] hover:scale-105 pointer-events-auto cursor-pointer duration-500">
                <DashboardCard title="Live Consultation" icon={MessageSquare} className="h-60 ring-4 ring-white/10">
                  <LiveChatCard />
                </DashboardCard>
              </div>
              <div className="absolute bottom-[2%] right-[22%] md:right-[35%] w-56 transform rotate-6 translate-y-4 z-10 hidden sm:block transition-all hover:translate-y-[-20px] hover:z-30 hover:rotate-0 hover:scale-110 pointer-events-auto cursor-pointer duration-500">
                <DashboardCard title="Safety Check" icon={Activity} className="h-44">
                  <CitationCard />
                </DashboardCard>
              </div>
              <div className="absolute bottom-[-10%] right-[5%] md:right-[20%] w-60 transform rotate-12 translate-y-10 opacity-90 transition-all hover:translate-y-0 hover:z-30 hover:rotate-0 hover:scale-110 pointer-events-auto cursor-pointer duration-500">
                <DashboardCard title="Documentation" icon={FileText} className="h-52 bg-white border-white/20">
                  <SummaryCard />
                </DashboardCard>
              </div>
            </div>
          </div>

          {/* Fade at bottom of hero to blend into next section */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-100 dark:from-black to-transparent z-30 pointer-events-none"></div>
        </div>

        {/* --- SECTION 2: IMPACT --- */}
        <ImpactSection />

        {/* --- SECTION 3: ORBIT --- */}
        <OrbitalTeamSection />

        {/* --- SECTION 4: STATS --- */}
        <AgentStatsSection />

        {/* --- SECTION 5: PRICING --- */}
        <PricingSection />

        {/* --- FOOTER --- */}
        <footer className="py-6 text-center text-slate-500 dark:text-zinc-600 text-sm border-t border-slate-200 dark:border-zinc-900 bg-slate-50 dark:bg-black relative z-20">
          <div className="mb-2 flex items-center justify-center gap-2 opacity-50">
            <span className="font-bold">MedBax</span>
          </div>
          &copy; 2025 MedBax AI. All rights reserved.
        </footer>

      </div>
    </>
  );
}