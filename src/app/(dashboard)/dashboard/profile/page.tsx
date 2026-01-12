"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { ContentSkeleton } from "@/components/ui/skeleton";
import { PatientNotFound } from "@/components/ui/PatientNotFound";
import {
    User,
    Calendar,
    Ruler,
    Scale,
    Heart,
    AlertTriangle,
    Pill,
    Stethoscope,
    Wine,
    Users,
    FileText,
    Upload
} from "lucide-react";

export default function PatientProfilePage() {
    const patient = useQuery(api.patients.getMyPatient);
    const currentUser = useQuery(api.users.current);

    if (patient === undefined || currentUser === undefined) {
        return <ContentSkeleton />;
    }

    if (patient === null) {
        return <PatientNotFound />;
    }

    // Calculate age from DOB
    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;

    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Patient Profile
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                        Manage your medical information and health records
                    </p>
                </div>
            </div>

            {/* Demographics Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Demographics
                    </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs mb-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Age
                        </div>
                        <p className="text-xl font-semibold text-slate-900 dark:text-white">
                            {age ?? "—"} <span className="text-sm font-normal text-slate-500">years</span>
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs mb-1">
                            <User className="h-3.5 w-3.5" />
                            Biological Sex
                        </div>
                        <p className="text-xl font-semibold text-slate-900 dark:text-white capitalize">
                            {patient.biologicalSex ?? "—"}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs mb-1">
                            <Ruler className="h-3.5 w-3.5" />
                            Height
                        </div>
                        <p className="text-xl font-semibold text-slate-900 dark:text-white">
                            {patient.heightCm ?? "—"} <span className="text-sm font-normal text-slate-500">cm</span>
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs mb-1">
                            <Scale className="h-3.5 w-3.5" />
                            Weight
                        </div>
                        <p className="text-xl font-semibold text-slate-900 dark:text-white">
                            {patient.weightKg ?? "—"} <span className="text-sm font-normal text-slate-500">kg</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Clinical Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Conditions Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                        <Heart className="h-5 w-5 text-red-500" />
                        Chronic Conditions
                    </h2>
                    {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {patient.chronicConditions.map((item: { condition: string; status: string }, idx: number) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/30 rounded-full text-red-700 dark:text-red-300 text-sm"
                                >
                                    {item.condition}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 dark:text-zinc-500 text-sm italic">No conditions recorded</p>
                    )}
                </div>

                {/* Allergies Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Allergies
                    </h2>
                    {patient.allergies && patient.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {patient.allergies.map((item: { agent: string }, idx: number) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-500/30 rounded-full text-amber-700 dark:text-amber-300 text-sm"
                                >
                                    {item.agent}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 dark:text-zinc-500 text-sm italic">No allergies recorded</p>
                    )}
                </div>
            </div>

            {/* Medications Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <Pill className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Current Medications
                </h2>
                {patient.medications && patient.medications.length > 0 ? (
                    <div className="space-y-3">
                        {patient.medications.map((med: { name: string; dosage: string; frequency: string }, idx: number) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                                        <Pill className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">{med.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                                            {med.dosage} • {med.frequency}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 dark:text-zinc-500 text-sm italic">No medications recorded</p>
                )}
            </div>

            {/* Surgeries Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <Stethoscope className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Past Surgeries
                </h2>
                {patient.surgeries && patient.surgeries.length > 0 ? (
                    <div className="space-y-2">
                        {patient.surgeries.map((surgery: { procedure: string; date?: string }, idx: number) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl"
                            >
                                <span className="text-slate-900 dark:text-white">{surgery.procedure}</span>
                                {surgery.date && (
                                    <span className="text-xs text-slate-500 dark:text-zinc-400">{surgery.date}</span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 dark:text-zinc-500 text-sm italic">No surgeries recorded</p>
                )}
            </div>

            {/* Lifestyle Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <Wine className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Lifestyle
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4">
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Smoking Status</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                            {patient.socialHistory?.smokingStatus ?? "Not specified"}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4">
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Alcohol Consumption</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                            {patient.socialHistory?.alcoholConsumption ?? "Not specified"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Family History Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Family History
                </h2>
                {patient.familyHistory && patient.familyHistory.length > 0 ? (
                    <div className="space-y-2">
                        {patient.familyHistory.map((item: { relation: string; condition: string }, idx: number) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl"
                            >
                                <span className="font-medium text-slate-700 dark:text-zinc-300">{item.relation}:</span>
                                <span className="text-slate-600 dark:text-zinc-400">{item.condition}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 dark:text-zinc-500 text-sm italic">No family history recorded</p>
                )}
            </div>

            {/* Documents Section (Placeholder) */}
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        Medical Documents
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4 max-w-sm">
                        Upload EMRs, lab results, and other medical records to provide more context to the AI assistant.
                    </p>
                    <button
                        disabled
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-zinc-700 text-slate-400 dark:text-zinc-500 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                        <Upload className="h-4 w-4" />
                        Coming Soon
                    </button>
                </div>
            </div>
        </div>
    );
}
