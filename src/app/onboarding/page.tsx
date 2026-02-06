'use client';

import { useState, useEffect, Suspense } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowRight, Check, Plus, Trash2, ShieldCheck, Activity, Pill, User, X, Stethoscope, Wine, Users, Zap, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// --- TYPES (Updated to match Backend Schema) ---
type PatientFormData = {
    // Basics
    dateOfBirth: string;
    biologicalSex: "male" | "female" | "intersex";
    genderIdentity: string;
    weightKg: number;
    heightCm: number;

    // Clinical
    chronicConditions: Array<{ condition: string; status: "active" | "managed" | "remission" }>;
    allergies: Array<{ agent: string; reactionType: "allergy" | "intolerance"; severity?: "mild" | "moderate" | "severe"; reactionDetails?: string }>;
    surgeries: Array<{ procedure: string; date?: string; notes?: string; implants?: boolean }>;

    // Lifestyle & Family
    socialHistory: {
        smokingStatus?: string;
        alcoholConsumption?: string;
        occupation?: string;
        recreationalDrugs?: boolean;
    };
    familyHistory: Array<{ condition: string; relation: string }>;

    // Meds
    medications: Array<{ name: string; dosage: string; frequency: string; type: "prescription" | "supplement" | "otc" }>;
};

type ValidationErrors = {
    dateOfBirth?: string;
    heightCm?: string;
    weightKg?: string;
};

// --- INITIAL DATA (Strict defaults to prevent crashes) ---
const INITIAL_DATA: PatientFormData = {
    dateOfBirth: "",
    biologicalSex: "male",
    genderIdentity: "",
    weightKg: 0,
    heightCm: 0,
    chronicConditions: [],
    allergies: [],
    surgeries: [],
    socialHistory: { smokingStatus: "Never", alcoholConsumption: "None" },
    familyHistory: [],
    medications: [],
};

function OnboardingFlow() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoaded, isSignedIn } = useUser();

    // Convex queries and mutations
    const currentUser = useQuery(api.users.current);
    const createPatient = useMutation(api.patients.create);
    const updateOnboardingStep = useMutation(api.users.updateOnboardingStep);
    const completeOnboarding = useMutation(api.users.completeOnboarding);
    const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<PatientFormData>(INITIAL_DATA);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [initializedFromDb, setInitializedFromDb] = useState(false);
    const [intendedPlan, setIntendedPlan] = useState<string | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/");
        }
    }, [isLoaded, isSignedIn, router]);

    // Initialize step from saved progress
    useEffect(() => {
        if (currentUser && !initializedFromDb) {
            // If user already completed onboarding, redirect to chat
            if (currentUser.onboardingComplete) {
                router.push("/dashboard/chat");
                return;
            }
            // Resume from saved step (handle optional field)
            if (currentUser.onboardingStep && currentUser.onboardingStep > 1) {
                setStep(currentUser.onboardingStep);
            }
            setInitializedFromDb(true);
        }
    }, [currentUser, initializedFromDb, router]);

    useEffect(() => {
        setMounted(true);
        // Capture plan intent from URL
        const plan = searchParams.get('plan');
        if (plan && (plan === 'pro' || plan === 'premium')) {
            setIntendedPlan(plan);
        }
    }, [searchParams]);

    const totalSteps = 6; // Medical history (5) + Pricing (1)

    // --- VALIDATION ---
    const validateStep1 = (): boolean => {
        const newErrors: ValidationErrors = {};
        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = "Date of birth is required.";
        } else {
            const dob = new Date(formData.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - dob.getFullYear();
            if (isNaN(dob.getTime())) newErrors.dateOfBirth = "Invalid date format.";
            else if (dob > today) newErrors.dateOfBirth = "Date cannot be in the future.";
            else if (age < 1 || age > 120) newErrors.dateOfBirth = "Age must be between 1 and 120.";
        }
        if (!formData.heightCm || formData.heightCm <= 0) newErrors.heightCm = "Height is required.";
        if (!formData.weightKg || formData.weightKg <= 0) newErrors.weightKg = "Weight is required.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = async () => {
        if (step === 1 && !validateStep1()) return;

        if (step < 5) {
            // Still in medical history steps
            const nextStep = step + 1;
            setStep(nextStep);
            try {
                await updateOnboardingStep({ step: nextStep });
            } catch (e) {
                console.error("Failed to save step progress", e);
            }
        } else if (step === 5) {
            // Moving from medical history review to pricing
            setLoading(true);
            try {
                // Save patient data
                await createPatient({
                    ...formData,
                    allergies: formData.allergies.map(a => ({ ...a, reactionType: a.reactionType as "allergy" | "intolerance" })),
                });
                // Move to pricing step
                setStep(6);
                await updateOnboardingStep({ step: 6 });
            } catch (e) {
                console.error("Failed to save patient data", e);
                alert("Failed to save profile. Check console for details.");
            } finally {
                setLoading(false);
            }
        }
        // Step 6 (pricing) is handled by its own buttons
    };

    const handleSkipToPricing = async () => {
        setLoading(true);
        try {
            // Save whatever data we have so far
            await createPatient({
                ...formData,
                allergies: formData.allergies.map(a => ({ ...a, reactionType: a.reactionType as "allergy" | "intolerance" })),
            });
            // Jump to pricing
            setStep(6);
            await updateOnboardingStep({ step: 6 });
        } catch (e) {
            console.error("Failed to save partial data", e);
            alert("Failed to save profile. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const handleSkipUpgrade = async () => {
        setLoading(true);
        try {
            await completeOnboarding();
            // Check for pending prompt from landing page
            const pendingPrompt = localStorage.getItem('pendingPrompt');
            if (pendingPrompt) {
                localStorage.removeItem('pendingPrompt');
                router.push(`/dashboard/chat?landingPrompt=${encodeURIComponent(pendingPrompt)}`);
            } else {
                router.push("/dashboard/chat");
            }
        } catch (e) {
            console.error("Failed to complete onboarding", e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (plan: "pro" | "premium") => {
        setLoading(true);
        try {
            const url = await createCheckoutSession({ plan });
            if (url) {
                // Mark onboarding as complete before redirect
                await completeOnboarding();
                window.location.href = url;
            }
        } catch (e) {
            console.error("Checkout failed", e);
            alert("Failed to start checkout. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    // Show nothing while auth is loading, not signed in, or checking onboarding status
    if (!mounted || !isLoaded || !isSignedIn || currentUser === undefined) return null;

    // If already onboarded, show nothing (redirect is handled in useEffect)
    if (currentUser?.onboardingComplete) return null;

    return (
        <div className="flex min-h-screen w-full bg-white dark:bg-black font-inter selection:bg-indigo-500/30 overflow-hidden">
            {/* --- LEFT PANEL --- */}
            <div className="hidden lg:flex w-[40%] xl:w-[35%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-slate-900 dark:from-black dark:via-zinc-900 dark:to-zinc-800 border-r border-indigo-200/50 dark:border-white/10">
                {/* Background FX */}
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] rounded-full border border-indigo-200/50 dark:border-white/10 pointer-events-none"></div>
                <div className="absolute top-[22%] left-[48%] -translate-x-1/2 w-[75vw] h-[75vw] rounded-full border border-blue-200/30 dark:border-white/5 pointer-events-none"></div>
                <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-300/40 dark:bg-zinc-500/20 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="relative z-10 flex items-center gap-3">
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">MedBax</span>
                </div>

                <div className="relative z-10 max-w-sm">
                    <h1 className="text-5xl font-medium text-slate-900 dark:text-white leading-[1.1] font-kalice mb-6">
                        Your medical <br />
                        <span className="text-indigo-600 dark:text-indigo-400">Context Window.</span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg font-light leading-relaxed">
                        We&apos;re digitizing your anamnesis. This data creates the &quot;System Prompt&quot; for your personal medical AI.
                    </p>
                </div>

                {/* Trust Badge */}
                <div className="relative z-10">
                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-2xl">
                        <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Doctor" className="h-10 w-10 rounded-full border border-slate-200 dark:border-white/20" />
                        <div>
                            <p className="text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed">&quot;The structured intake flow allows the AI to catch drug interactions that human review might miss.&quot;</p>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">Dr. Sarah Chen</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL (Form Wizard) --- */}
            <div className="flex-1 flex flex-col relative bg-white dark:bg-black">
                {/* Mobile Header */}
                <div className="lg:hidden p-6 flex justify-between items-center border-b border-slate-100 dark:border-zinc-900">
                    <span className="font-bold text-lg dark:text-white">MedBax</span>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
                <div className="hidden lg:flex items-center gap-4 absolute top-8 right-8 z-20">
                    <ThemeToggle />
                    <UserButton afterSignOutUrl="/" />
                </div>

                <div className="flex-1 flex flex-col justify-start items-center p-6 md:p-12 pt-6 md:pt-24 overflow-y-auto">
                    <div className="w-full max-w-2xl">
                        {/* Step Counter */}
                        <div className="mb-10 flex items-center gap-3">
                            <div className="text-sm font-medium text-slate-400 dark:text-zinc-500">
                                Step {step} of {totalSteps}
                            </div>
                            <div className="flex-1 h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
                            </div>
                        </div>

                        {/* Dynamic Content */}
                        <div className="min-h-[400px]">
                            {step === 1 && <StepBasics data={formData} update={setFormData} errors={errors} />}
                            {step === 2 && <StepClinicalHistory data={formData} update={setFormData} />}
                            {step === 3 && <StepLifestyle data={formData} update={setFormData} />}
                            {step === 4 && <StepMedications data={formData} update={setFormData} />}
                            {step === 5 && <StepReview data={formData} />}
                            {step === 6 && <StepPricing intendedPlan={intendedPlan} onSkip={handleSkipUpgrade} onUpgrade={handleUpgrade} loading={loading} />}
                        </div>

                        {/* Footer Navigation */}
                        {step < 6 && (
                            <div className="mt-12 pt-6 border-t border-slate-100 dark:border-zinc-900">
                                <div className="flex items-center justify-between gap-4">
                                    <button onClick={handleBack} disabled={step === 1} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${step === 1 ? 'text-slate-300 dark:text-zinc-700 cursor-not-allowed' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}>
                                        Go Back
                                    </button>
                                    <div className="flex items-center gap-4">
                                        {step >= 2 && step <= 5 && (
                                            <button onClick={handleSkipToPricing} disabled={loading} className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-70 disabled:cursor-wait">
                                                {loading ? "Skipping..." : "Skip"}
                                            </button>
                                        )}
                                        <button onClick={handleNext} disabled={loading} className="group flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-70 disabled:cursor-wait">
                                            {loading ? "Saving..." : step === 5 ? "Continue to Pricing" : "Continue"}
                                            {!loading && <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SHARED UI HELPERS ---
const SectionHeader = ({ title, subtitle, icon: Icon }: any) => (
    <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3 mb-4">
            {Icon && <div className="p-2 rounded-lg bg-indigo-50 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400"><Icon size={20} /></div>}
        </div>
        <h2 className="text-3xl md:text-4xl font-medium text-slate-900 dark:text-white font-kalice tracking-tight">{title}</h2>
        <p className="text-slate-500 dark:text-zinc-400 text-lg font-light max-w-md">{subtitle}</p>
    </div>
);

const Label = ({ children }: any) => (
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-3 ml-1">
        {children}
    </label>
);

const PillSelector = ({ options, value, onChange }: any) => (
    <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => (
            <button
                key={opt}
                onClick={() => onChange(opt)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${value === opt
                    ? "bg-slate-900 dark:bg-white text-white dark:text-black border-transparent shadow-md transform scale-[1.02]"
                    : "bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
            >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
        ))}
    </div>
);

// --- STEP 1: BASICS ---
function StepBasics({ data, update, errors }: { data: PatientFormData, update: any, errors: ValidationErrors }) {
    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <SectionHeader title="Let's start with the basics." subtitle="We use these metrics to calculate physiological reference ranges." icon={User} />
            <div className="space-y-8">
                <div>
                    <Label>Biological Sex</Label>
                    <PillSelector options={['male', 'female', 'intersex']} value={data.biologicalSex} onChange={(val: any) => update({ ...data, biologicalSex: val })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>Date of Birth</Label>
                        <input type="date" value={data.dateOfBirth} onChange={(e) => update({ ...data, dateOfBirth: e.target.value })} className={`w-full bg-white dark:bg-zinc-900/50 border rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all ${errors.dateOfBirth ? 'border-red-500' : 'border-slate-200 dark:border-zinc-800'}`} />
                        {errors.dateOfBirth && <p className="text-red-500 text-xs mt-2 ml-1">{errors.dateOfBirth}</p>}
                    </div>
                </div>
                <div>
                    <Label>Anthropometry</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`group bg-slate-50 dark:bg-zinc-900/50 border rounded-xl p-4 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all ${errors.heightCm ? 'border-red-500' : 'border-slate-200 dark:border-zinc-800'}`}>
                            <span className="text-xs text-slate-400">Height (cm)</span>
                            <input type="number" placeholder="180" value={data.heightCm || ""} onChange={(e) => update({ ...data, heightCm: Number(e.target.value) })} className="w-full bg-transparent text-xl font-semibold text-slate-900 dark:text-white outline-none mt-1 placeholder:text-slate-300" />
                            {errors.heightCm && <p className="text-red-500 text-xs mt-2">{errors.heightCm}</p>}
                        </div>
                        <div className={`group bg-slate-50 dark:bg-zinc-900/50 border rounded-xl p-4 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all ${errors.weightKg ? 'border-red-500' : 'border-slate-200 dark:border-zinc-800'}`}>
                            <span className="text-xs text-slate-400">Weight (kg)</span>
                            <input type="number" placeholder="75" value={data.weightKg || ""} onChange={(e) => update({ ...data, weightKg: Number(e.target.value) })} className="w-full bg-transparent text-xl font-semibold text-slate-900 dark:text-white outline-none mt-1 placeholder:text-slate-300" />
                            {errors.weightKg && <p className="text-red-500 text-xs mt-2">{errors.weightKg}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- STEP 2: CLINICAL HISTORY (Conditions + Allergies + Surgeries) ---
function StepClinicalHistory({ data, update }: { data: PatientFormData, update: any }) {
    const [condInput, setCondInput] = useState("");
    const [allergyInput, setAllergyInput] = useState("");
    const [surgeryInput, setSurgeryInput] = useState("");

    const addCondition = () => {
        if (!condInput.trim()) return;
        update({ ...data, chronicConditions: [...data.chronicConditions, { condition: condInput, status: "active" }] });
        setCondInput("");
    };

    const addAllergy = () => {
        if (!allergyInput.trim()) return;
        update({ ...data, allergies: [...data.allergies, { agent: allergyInput, reactionType: "allergy", severity: "moderate" }] });
        setAllergyInput("");
    };

    const addSurgery = () => {
        if (!surgeryInput.trim()) return;
        update({ ...data, surgeries: [...data.surgeries, { procedure: surgeryInput, date: "", notes: "" }] });
        setSurgeryInput("");
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-10">
            <SectionHeader title="Clinical History" subtitle="Active diagnoses, allergies, and past procedures." icon={Stethoscope} />

            {/* CONDITIONS */}
            <div className="space-y-4">
                <Label>Chronic Conditions</Label>
                <div className="relative">
                    <input type="text" placeholder="Type condition (e.g. Diabetes)..." value={condInput} onChange={(e) => setCondInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCondition()} className="w-full pl-5 pr-12 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none" />
                    <button onClick={addCondition} className="absolute right-2 top-2 p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg"><Plus size={16} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {data.chronicConditions.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 rounded-full text-indigo-700 dark:text-indigo-300 text-sm">
                            {item.condition}
                            <button onClick={() => { const l = [...data.chronicConditions]; l.splice(idx, 1); update({ ...data, chronicConditions: l }); }}><X size={12} /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ALLERGIES */}
            <div className="space-y-4">
                <Label>Allergies & Intolerances</Label>
                <div className="relative">
                    <input type="text" placeholder="Type allergen (e.g. Penicillin)..." value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addAllergy()} className="w-full pl-5 pr-12 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none" />
                    <button onClick={addAllergy} className="absolute right-2 top-2 p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg"><Plus size={16} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {data.allergies.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/30 rounded-full text-red-700 dark:text-red-300 text-sm">
                            {item.agent}
                            <button onClick={() => { const l = [...data.allergies]; l.splice(idx, 1); update({ ...data, allergies: l }); }}><X size={12} /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* SURGERIES */}
            <div className="space-y-4">
                <Label>Past Surgeries</Label>
                <div className="relative">
                    <input type="text" placeholder="Procedure (e.g. Appendectomy)..." value={surgeryInput} onChange={(e) => setSurgeryInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSurgery()} className="w-full pl-5 pr-12 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none" />
                    <button onClick={addSurgery} className="absolute right-2 top-2 p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg"><Plus size={16} /></button>
                </div>
                <ul className="space-y-2">
                    {data.surgeries.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-lg text-sm border border-slate-100 dark:border-zinc-800">
                            <span>{item.procedure}</span>
                            <button onClick={() => { const l = [...data.surgeries]; l.splice(idx, 1); update({ ...data, surgeries: l }); }} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// --- STEP 3: LIFESTYLE & FAMILY ---
function StepLifestyle({ data, update }: { data: PatientFormData, update: any }) {
    const [famInput, setFamInput] = useState({ relation: "Parent", condition: "" });

    const addFam = () => {
        if (!famInput.condition) return;
        update({ ...data, familyHistory: [...data.familyHistory, { ...famInput }] });
        setFamInput({ ...famInput, condition: "" });
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-10">
            <SectionHeader title="Lifestyle & Family" subtitle="Environmental factors and hereditary risks." icon={Wine} />

            {/* SOCIAL HISTORY */}
            <div className="space-y-6">
                <div>
                    <Label>Smoking Status</Label>
                    <PillSelector options={['Never', 'Former', 'Current']} value={data.socialHistory.smokingStatus || 'Never'} onChange={(val: string) => update({ ...data, socialHistory: { ...data.socialHistory, smokingStatus: val } })} />
                </div>
                <div>
                    <Label>Alcohol Consumption</Label>
                    <PillSelector options={['None', 'Occasional', 'Moderate', 'Heavy']} value={data.socialHistory.alcoholConsumption || 'None'} onChange={(val: string) => update({ ...data, socialHistory: { ...data.socialHistory, alcoholConsumption: val } })} />
                </div>
            </div>

            <hr className="border-slate-100 dark:border-zinc-800" />

            {/* FAMILY HISTORY */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    <Label>Family History</Label>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                    <select className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none" value={famInput.relation} onChange={e => setFamInput({ ...famInput, relation: e.target.value })}>
                        <option>Parent</option>
                        <option>Sibling</option>
                        <option>Grandparent</option>
                    </select>
                    <input type="text" placeholder="Condition..." className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none" value={famInput.condition} onChange={e => setFamInput({ ...famInput, condition: e.target.value })} />
                    <button onClick={addFam} className="bg-slate-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-sm font-medium">Add</button>
                </div>
                <ul className="space-y-2">
                    {data.familyHistory.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-lg text-sm border border-slate-100 dark:border-zinc-800">
                            <div><span className="font-semibold text-slate-700 dark:text-zinc-300">{item.relation}:</span> {item.condition}</div>
                            <button onClick={() => { const l = [...data.familyHistory]; l.splice(idx, 1); update({ ...data, familyHistory: l }); }} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// --- STEP 4: MEDICATIONS ---
function StepMedications({ data, update }: { data: PatientFormData, update: any }) {
    const [temp, setTemp] = useState({ name: "", dosage: "", frequency: "Daily" });

    const add = () => {
        if (!temp.name) return;
        update({
            ...data,
            medications: [...data.medications, { ...temp, type: "prescription" }]
        });
        setTemp({ name: "", dosage: "", frequency: "Daily" });
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <SectionHeader title="Pharmacotherapy" subtitle="Add current medications, supplements, or OTC drugs." icon={Pill} />
            <div className="grid gap-8">
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-slate-500 ml-1 mb-1.5 block">Drug Name</label>
                            <input type="text" placeholder="e.g. Lisinopril" value={temp.name} onChange={(e) => setTemp({ ...temp, name: e.target.value })} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 ml-1 mb-1.5 block">Dosage</label>
                            <input type="text" placeholder="e.g. 10mg" value={temp.dosage} onChange={(e) => setTemp({ ...temp, dosage: e.target.value })} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 ml-1 mb-1.5 block">Frequency</label>
                            <select value={temp.frequency} onChange={(e) => setTemp({ ...temp, frequency: e.target.value })} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none">
                                <option>Daily</option><option>BID (2x Daily)</option><option>TID (3x Daily)</option><option>Weekly</option><option>PRN (As needed)</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={add} disabled={!temp.name} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">Add Medication</button>
                </div>
                <div className="space-y-3">
                    {data.medications.map((m, i) => (
                        <div key={i} className="group flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-indigo-300 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400"><Pill size={18} /></div>
                                <div><h4 className="font-medium text-slate-900 dark:text-white">{m.name}</h4><p className="text-xs text-slate-500">{m.dosage} • {m.frequency}</p></div>
                            </div>
                            <button onClick={() => { const list = [...data.medications]; list.splice(i, 1); update({ ...data, medications: list }); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- STEP 5: REVIEW ---
function StepReview({ data }: { data: PatientFormData }) {
    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <SectionHeader title="Review & Confirm" subtitle="Please verify your clinical profile before we generate your encryption keys." icon={ShieldCheck} />
            <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
                <div className="p-6 md:p-8 space-y-8">
                    <div className="flex items-start justify-between pb-6 border-b border-slate-200 dark:border-zinc-800">
                        <div>
                            <Label>Demographics</Label>
                            <div className="text-2xl font-medium text-slate-900 dark:text-white font-kalice capitalize">
                                {data.biologicalSex}, {new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear()} years
                            </div>
                            <div className="text-slate-500 mt-1">{data.heightCm}cm • {data.weightKg}kg</div>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <Label>Clinical Summary</Label>
                            <ul className="space-y-2 mt-2">
                                <li className="text-sm font-medium">Conditions: <span className="font-normal text-slate-500">{data.chronicConditions.map(c => c.condition).join(", ") || "None"}</span></li>
                                <li className="text-sm font-medium">Allergies: <span className="font-normal text-slate-500">{data.allergies.map(a => a.agent).join(", ") || "None"}</span></li>
                                <li className="text-sm font-medium">Surgeries: <span className="font-normal text-slate-500">{data.surgeries.map(s => s.procedure).join(", ") || "None"}</span></li>
                            </ul>
                        </div>
                        <div>
                            <Label>Medications</Label>
                            <ul className="space-y-2 mt-2">
                                {data.medications.length > 0 ? data.medications.map((m, i) => (
                                    <li key={i} className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 text-sm">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400"></div>{m.name} <span className="text-slate-400 text-xs">({m.dosage})</span>
                                    </li>
                                )) : <li className="text-slate-400 italic text-sm">None listed</li>}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- STEP 6: PRICING ---
function StepPricing({ intendedPlan, onSkip, onUpgrade, loading }: { intendedPlan: string | null, onSkip: () => void, onUpgrade: (plan: "pro" | "premium") => void, loading: boolean }) {
    const plans = [
        { name: "Pro", slug: "pro", price: 9.99, queries: 100, features: ["100 queries/month", "All knowledge bases", "Source citations", "Priority support"], popular: intendedPlan === "pro" },
        { name: "Pro+", slug: "premium", price: 29.99, queries: 1000, features: ["1,000 queries/month", "All knowledge bases", "Source citations", "Priority support", "Advanced analytics"], popular: intendedPlan === "premium" },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <SectionHeader
                title="Choose your plan"
                subtitle="Upgrade for more queries and features. You can change plans anytime."
                icon={Sparkles}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {plans.map((plan) => (
                    <div
                        key={plan.slug}
                        className={`relative rounded-2xl p-6 border transition-all ${plan.popular
                            ? "bg-gradient-to-b from-indigo-700 to-indigo-800 text-white ring-4 ring-indigo-700/20 shadow-xl scale-105"
                            : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="bg-white text-indigo-600 text-xs font-bold px-3 py-1 rounded-full shadow">
                                    Recommended for You
                                </span>
                            </div>
                        )}

                        <h3 className={`text-xl font-semibold mb-1 ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                            {plan.name}
                        </h3>

                        <div className="mb-4">
                            <div className="flex items-baseline gap-1">
                                <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                                    ${plan.price}
                                </span>
                                <span className={`text-sm ${plan.popular ? "text-indigo-200" : "text-slate-500 dark:text-zinc-400"}`}>
                                    /month
                                </span>
                            </div>
                        </div>

                        <div className={`flex items-center gap-3 p-3 rounded-xl mb-6 ${plan.popular ? "bg-white/10" : "bg-indigo-50 dark:bg-indigo-900/20"
                            }`}>
                            <Zap className={`w-5 h-5 ${plan.popular ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`} />
                            <div>
                                <p className={`font-semibold text-sm ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                                    {plan.queries} queries/month
                                </p>
                            </div>
                        </div>

                        <ul className="space-y-2 mb-6 min-h-[140px]">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                    <Check className={`w-4 h-4 ${plan.popular ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`} />
                                    <span className={plan.popular ? "text-white" : "text-slate-700 dark:text-zinc-300"}>
                                        {feature}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => onUpgrade(plan.slug as "pro" | "premium")}
                            disabled={loading}
                            className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${plan.popular
                                ? "bg-white text-indigo-600 hover:bg-indigo-50"
                                : "bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200"
                                } disabled:opacity-50`}
                        >
                            {loading ? "Processing..." : `Start ${plan.name}`}
                        </button>
                    </div>
                ))}
            </div>

            {/* Continue with Free Button */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-zinc-800 flex justify-center">
                <button
                    onClick={onSkip}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-70 disabled:cursor-wait"
                >
                    {loading ? "Completing..." : "Continue with Free (20 queries/month)"}
                </button>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-zinc-400 mt-6">
                You can upgrade or downgrade your plan anytime from your dashboard settings.
            </p>
        </div>
    );
}

// Export with Suspense boundary to fix Next.js build error
export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <OnboardingFlow />
        </Suspense>
    );
}
