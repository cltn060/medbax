"use client";

import { X, User, Heart, AlertTriangle, Pill, ChevronRight } from "lucide-react";
import { useState } from "react";
import { EditProfileModal } from "../dashboard/EditProfileModal";

interface PatientData {
    _id: string;
    dateOfBirth?: string;
    biologicalSex?: string;
    heightCm?: number;
    weightKg?: number;
    chronicConditions?: Array<{ condition: string; status: string }>;
    allergies?: Array<{ agent: string }>;
    medications?: Array<{ name: string; dosage: string; frequency: string }>;
}

interface HealthSnapshotPanelProps {
    patient: PatientData;
    onClose: () => void;
}

export function HealthSnapshotPanel({ patient, onClose }: HealthSnapshotPanelProps) {
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

    // Calculate BMI
    const bmi = patient.heightCm && patient.weightKg
        ? (patient.weightKg / Math.pow(patient.heightCm / 100, 2)).toFixed(1)
        : null;

    return (
        <div className="w-72 h-full border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">Health Context</h3>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-zinc-900 rounded-lg p-3">
                        <div className="text-xs text-slate-500 dark:text-zinc-500">Age</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                            {age ?? "—"}
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-900 rounded-lg p-3">
                        <div className="text-xs text-slate-500 dark:text-zinc-500">Sex</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
                            {patient.biologicalSex?.charAt(0).toUpperCase() ?? "—"}
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-900 rounded-lg p-3">
                        <div className="text-xs text-slate-500 dark:text-zinc-500">BMI</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                            {bmi ?? "—"}
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-900 rounded-lg p-3">
                        <div className="text-xs text-slate-500 dark:text-zinc-500">Weight</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                            {patient.weightKg ?? "—"}<span className="text-xs font-normal">kg</span>
                        </div>
                    </div>
                </div>

                {/* Conditions */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">Conditions</span>
                    </div>
                    {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {patient.chronicConditions.slice(0, 4).map((c, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded-full"
                                >
                                    {c.condition}
                                </span>
                            ))}
                            {patient.chronicConditions.length > 4 && (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-xs rounded-full">
                                    +{patient.chronicConditions.length - 4}
                                </span>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 dark:text-zinc-500 italic">None recorded</p>
                    )}
                </div>

                {/* Allergies */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">Allergies</span>
                    </div>
                    {patient.allergies && patient.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {patient.allergies.slice(0, 4).map((a, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs rounded-full"
                                >
                                    {a.agent}
                                </span>
                            ))}
                            {patient.allergies.length > 4 && (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-xs rounded-full">
                                    +{patient.allergies.length - 4}
                                </span>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 dark:text-zinc-500 italic">None recorded</p>
                    )}
                </div>

                {/* Medications */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Pill className="h-4 w-4 text-indigo-500" />
                        <span className="text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                            Medications ({patient.medications?.length ?? 0})
                        </span>
                    </div>
                    {patient.medications && patient.medications.length > 0 ? (
                        <div className="space-y-1">
                            {patient.medications.slice(0, 3).map((m, i) => (
                                <div
                                    key={i}
                                    className="text-xs bg-slate-50 dark:bg-zinc-900 rounded-lg px-2 py-1.5"
                                >
                                    <span className="font-medium text-slate-900 dark:text-white">{m.name}</span>
                                    <span className="text-slate-400 dark:text-zinc-500"> • {m.dosage}</span>
                                </div>
                            ))}
                            {patient.medications.length > 3 && (
                                <p className="text-xs text-slate-400 dark:text-zinc-500">
                                    +{patient.medications.length - 3} more
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 dark:text-zinc-500 italic">None recorded</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-zinc-800">
                <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center justify-center gap-1 w-full py-2 px-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                >
                    View Full Profile
                    <ChevronRight className="h-3 w-3" />
                </button>
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
}
