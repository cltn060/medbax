"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";

export function OnboardingWizard() {
    const createPatient = useMutation(api.patients.create);
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        dateOfBirth: "",
        biologicalSex: "male" as "male" | "female" | "intersex",
        genderIdentity: "",
        bloodType: "",
        heightCm: "",
        weightKg: "",
        // Simple text inputs that we'll parse into arrays of objects
        chronicConditions: "",
        allergies: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            // Parse chronic conditions: "Diabetes, Hypertension" -> array of objects
            const parsedConditions = formData.chronicConditions
                ? formData.chronicConditions.split(",").map(s => ({
                    condition: s.trim(),
                    status: "active" as const,
                }))
                : [];

            // Parse allergies: "Penicillin, Peanuts" -> array of objects
            const parsedAllergies = formData.allergies
                ? formData.allergies.split(",").map(s => ({
                    agent: s.trim(),
                    reactionType: "allergy" as const,
                }))
                : [];

            await createPatient({
                dateOfBirth: formData.dateOfBirth,
                biologicalSex: formData.biologicalSex,
                genderIdentity: formData.genderIdentity || undefined,
                bloodType: formData.bloodType || undefined,
                heightCm: formData.heightCm ? parseFloat(formData.heightCm) : undefined,
                weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
                chronicConditions: parsedConditions,
                medications: [], // Empty for now, can add later
                allergies: parsedAllergies,
                surgeries: [], // Empty for now
                familyHistory: [], // Empty for now
                socialHistory: {}, // Empty object for now
            });
            router.push("/dashboard");
        } catch (err) {
            console.error("Failed to create profile:", err);
            alert("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Welcome to MedBax
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Let&apos;s set up your medical profile to get started.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <div className="space-y-6">

                        {step === 1 && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                    <div className="mt-1">
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            required
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Biological Sex</label>
                                    <div className="mt-1">
                                        <select
                                            name="biologicalSex"
                                            value={formData.biologicalSex}
                                            onChange={handleChange}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="intersex">Intersex</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Gender Identity (optional)</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="genderIdentity"
                                            value={formData.genderIdentity}
                                            onChange={handleChange}
                                            placeholder="How do you identify?"
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                                    <div className="mt-1">
                                        <input
                                            type="number"
                                            name="heightCm"
                                            value={formData.heightCm}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                                    <div className="mt-1">
                                        <input
                                            type="number"
                                            name="weightKg"
                                            value={formData.weightKg}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                                    <div className="mt-1">
                                        <select
                                            name="bloodType"
                                            value={formData.bloodType}
                                            onChange={handleChange}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        >
                                            <option value="">Unknown</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Chronic Conditions (comma separated)</label>
                                    <div className="mt-1">
                                        <textarea
                                            name="chronicConditions"
                                            rows={3}
                                            value={formData.chronicConditions}
                                            onChange={handleChange}
                                            placeholder="e.g., Diabetes, Hypertension"
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Allergies (comma separated)</label>
                                    <div className="mt-1">
                                        <textarea
                                            name="allergies"
                                            rows={3}
                                            value={formData.allergies}
                                            onChange={handleChange}
                                            placeholder="e.g., Penicillin, Peanuts"
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex justify-between">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                    Back
                                </button>
                            )}
                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step + 1)}
                                    className="ml-auto w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                    style={{ width: step > 1 ? 'auto' : '100%' }}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="ml-auto inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                    Complete Profile
                                </button>
                            )}
                        </div>

                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }}></div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
