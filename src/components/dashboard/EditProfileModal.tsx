"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
    X,
    Loader2,
    User,
    Heart,
    Activity,
    AlertTriangle,
    Pencil,
    Trash2,
    Check,
    Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Type for the patient data
type PatientData = {
    _id: Id<"patients">;
    dateOfBirth: string;
    biologicalSex: "male" | "female" | "intersex";
    genderIdentity?: string;
    bloodType?: string;
    heightCm?: number;
    weightKg?: number;
    chronicConditions: Array<{
        condition: string;
        diagnosedDate?: string;
        status: "active" | "managed" | "remission";
    }>;
    allergies: Array<{
        agent: string;
        reactionType: "allergy" | "intolerance";
        severity?: "mild" | "moderate" | "severe";
        reactionDetails?: string;
    }>;
    medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        route?: string;
        type: "prescription" | "supplement" | "otc";
        startDate?: string;
    }>;
    surgeries: Array<{
        procedure: string;
        date?: string;
        notes?: string;
        implants?: boolean;
    }>;
    familyHistory: Array<{
        relation: string;
        condition: string;
    }>;
    socialHistory: {
        smokingStatus?: string;
        alcoholConsumption?: string;
        occupation?: string;
        recreationalDrugs?: boolean;
    };
};

type TabId = "demographics" | "conditions" | "allergies" | "lifestyle";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "demographics", label: "Profile", icon: User },
    { id: "conditions", label: "Conditions", icon: Heart },
    { id: "allergies", label: "Allergies", icon: AlertTriangle },
    { id: "lifestyle", label: "Lifestyle", icon: Activity },
];

// --- STYLING COMPONENTS ---

// 1. Updated Profile Row to match Clerk's dense "Label left, Value right" look
function ProfileRow({
    label,
    value,
    onEdit,
    onDelete,
    placeholder = "Not set",
}: {
    label: string;
    value: string | undefined;
    onEdit: () => void;
    onDelete?: () => void;
    placeholder?: string;
}) {
    return (
        <div className="group flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
            <div className="flex items-center gap-4 flex-1">
                <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">
                    {label}
                </span>
                <span className={cn(
                    "text-[13px] text-zinc-900 dark:text-zinc-100 font-medium truncate",
                    !value && "text-zinc-400 italic font-normal"
                )}>
                    {value || placeholder}
                </span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="h-6 w-6 flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors"
                >
                    <Pencil className="h-3 w-3" />
                </button>
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="h-6 w-6 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    );
}

// 2. Clean Inline Edit Field
function InlineEditField({
    value,
    type = "text",
    options,
    onSave,
    onCancel,
}: {
    value: string;
    type?: "text" | "date" | "number" | "select";
    options?: { value: string; label: string }[];
    onSave: (value: string) => void;
    onCancel: () => void;
}) {
    const [editValue, setEditValue] = useState(value);

    return (
        <div className="flex items-center gap-2 py-1 w-full animate-in fade-in duration-200">
            {type === "select" && options ? (
                <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 h-8 px-2 text-[13px] border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    autoFocus
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 h-8 px-2 text-[13px] border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    autoFocus
                />
            )}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onSave(editValue)}
                    className="h-7 w-7 flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                >
                    <Check className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={onCancel}
                    className="h-7 w-7 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}

// 3. Updated List Item (Conditions/Allergies)
function ListItem({
    label,
    sublabel,
    onDelete,
}: {
    label: string;
    sublabel?: string;
    onDelete: () => void;
}) {
    return (
        <div className="flex items-center justify-between py-2.5 px-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-md group hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
            <div>
                <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
                {sublabel && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-0.5">{sublabel}</p>
                )}
            </div>
            <button
                onClick={onDelete}
                className="h-7 w-7 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

export function MedicalProfileModal({ isOpen, onClose }: MedicalProfileModalProps) {
    const patient = useQuery(api.patients.getMyPatient) as PatientData | null | undefined;
    const updatePatient = useMutation(api.patients.update);
    const [activeTab, setActiveTab] = useState<TabId>("demographics");
    const [editingField, setEditingField] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [addingItem, setAddingItem] = useState<string | null>(null);
    const [newItemValue, setNewItemValue] = useState("");

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setEditingField(null);
            setAddingItem(null);
            setNewItemValue("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSaveField = async (field: string, value: string) => {
        if (!patient) return;
        setIsSaving(true);
        try {
            const updateData: any = { id: patient._id };
            if (field === "heightCm" || field === "weightKg") {
                updateData[field] = value ? parseFloat(value) : undefined;
            } else if (field === "smokingStatus" || field === "alcoholConsumption" || field === "occupation") {
                updateData.socialHistory = { ...patient.socialHistory, [field]: value || undefined };
            } else {
                updateData[field] = value || undefined;
            }
            await updatePatient(updateData);
            setEditingField(null);
        } catch (err) {
            console.error("Failed to update:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddCondition = async () => {
        if (!patient || !newItemValue.trim()) return;
        setIsSaving(true);
        try {
            await updatePatient({
                id: patient._id,
                chronicConditions: [...(patient.chronicConditions || []), { condition: newItemValue.trim(), status: "active" }],
            });
            setNewItemValue("");
            setAddingItem(null);
        } catch (err) { console.error(err); } finally { setIsSaving(false); }
    };

    const handleRemoveCondition = async (index: number) => {
        if (!patient) return;
        setIsSaving(true);
        try {
            const updated = [...(patient.chronicConditions || [])];
            updated.splice(index, 1);
            await updatePatient({ id: patient._id, chronicConditions: updated });
        } catch (err) { console.error(err); } finally { setIsSaving(false); }
    };

    const handleAddAllergy = async () => {
        if (!patient || !newItemValue.trim()) return;
        setIsSaving(true);
        try {
            await updatePatient({
                id: patient._id,
                allergies: [...(patient.allergies || []), { agent: newItemValue.trim(), reactionType: "allergy" }],
            });
            setNewItemValue("");
            setAddingItem(null);
        } catch (err) { console.error(err); } finally { setIsSaving(false); }
    };

    const handleRemoveAllergy = async (index: number) => {
        if (!patient) return;
        setIsSaving(true);
        try {
            const updated = [...(patient.allergies || [])];
            updated.splice(index, 1);
            await updatePatient({ id: patient._id, allergies: updated });
        } catch (err) { console.error(err); } finally { setIsSaving(false); }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return undefined;
        try {
            return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        } catch { return dateStr; }
    };

    const calculateAge = (dateOfBirth: string) => {
        if (!dateOfBirth) return undefined;
        const today = new Date();
        const birth = new Date(dateOfBirth);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) { age--; }
        return `${age} years old`;
    };

    // Use portal to render outside of sidebar stacking context
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
            {/* Backdrop - visible on both mobile and desktop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container - Large modal with margins on mobile, centered modal on desktop */}
            <div className="relative bg-white dark:bg-[#111113] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden w-full max-w-md md:max-w-[920px] h-[90vh] max-h-[650px] md:h-[600px] md:max-h-none border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">

                {/* --- Mobile Header (visible only on mobile) --- */}
                <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                        Medical Profile
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-target"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* --- Mobile Tab Navigation (horizontal scrollable) --- */}
                <div className="md:hidden flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all",
                                    isActive
                                        ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                        : "border-transparent text-zinc-500 dark:text-zinc-400"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* --- Desktop Sidebar (hidden on mobile) --- */}
                {/* Slightly wider sidebar (240px) to balance the larger modal */}
                <div className="hidden md:flex w-[240px] bg-zinc-50/50 dark:bg-zinc-900/30 border-r border-zinc-200 dark:border-zinc-800 flex-col shrink-0">

                    {/* Sidebar Nav */}
                    <nav className="flex-1 p-3 space-y-1 mt-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
                                            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
                                    )}
                                >
                                    <Icon className={cn(
                                        "h-4 w-4",
                                        isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"
                                    )} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                MH
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-zinc-900 dark:text-white">My Account</span>
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Manage account</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#111113] overflow-hidden">
                    {/* Header - Desktop only (mobile has its own header above) */}
                    <div className="hidden md:flex px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50 justify-between items-center shrink-0">
                        <div>
                            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                                {tabs.find((t) => t.id === activeTab)?.label}
                            </h2>
                            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Manage your {activeTab} information
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
                        {isSaving && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                <Loader2 className="h-6 w-6 animate-spin text-zinc-900 dark:text-white" />
                            </div>
                        )}

                        <div className="max-w-3xl"> {/* Increased internal width constraint */}
                            {/* Demographics Tab */}
                            {activeTab === "demographics" && (
                                <div className="space-y-1">
                                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-3">
                                        Personal Information
                                    </h3>

                                    {/* Date of Birth */}
                                    {editingField === "dateOfBirth" ? (
                                        <div className="py-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Date of Birth</span>
                                            <InlineEditField
                                                value={patient?.dateOfBirth || ""}
                                                type="date"
                                                onSave={(v) => handleSaveField("dateOfBirth", v)}
                                                onCancel={() => setEditingField(null)}
                                            />
                                        </div>
                                    ) : (
                                        <ProfileRow
                                            label="Date of Birth"
                                            value={patient?.dateOfBirth ? `${formatDate(patient.dateOfBirth)} (${calculateAge(patient.dateOfBirth)})` : undefined}
                                            onEdit={() => setEditingField("dateOfBirth")}
                                        />
                                    )}

                                    {/* Biological Sex */}
                                    {editingField === "biologicalSex" ? (
                                        <div className="py-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Biological Sex</span>
                                            <InlineEditField
                                                value={patient?.biologicalSex || "male"}
                                                type="select"
                                                options={[
                                                    { value: "male", label: "Male" },
                                                    { value: "female", label: "Female" },
                                                    { value: "intersex", label: "Intersex" },
                                                ]}
                                                onSave={(v) => handleSaveField("biologicalSex", v)}
                                                onCancel={() => setEditingField(null)}
                                            />
                                        </div>
                                    ) : (
                                        <ProfileRow
                                            label="Biological Sex"
                                            value={patient?.biologicalSex ? patient.biologicalSex.charAt(0).toUpperCase() + patient.biologicalSex.slice(1) : undefined}
                                            onEdit={() => setEditingField("biologicalSex")}
                                        />
                                    )}

                                    {/* Blood Type */}
                                    {editingField === "bloodType" ? (
                                        <div className="py-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Blood Type</span>
                                            <InlineEditField
                                                value={patient?.bloodType || ""}
                                                type="select"
                                                options={[
                                                    { value: "", label: "Unknown" },
                                                    { value: "A+", label: "A+" },
                                                    { value: "A-", label: "A-" },
                                                    { value: "B+", label: "B+" },
                                                    { value: "B-", label: "B-" },
                                                    { value: "AB+", label: "AB+" },
                                                    { value: "AB-", label: "AB-" },
                                                    { value: "O+", label: "O+" },
                                                    { value: "O-", label: "O-" },
                                                ]}
                                                onSave={(v) => handleSaveField("bloodType", v)}
                                                onCancel={() => setEditingField(null)}
                                            />
                                        </div>
                                    ) : (
                                        <ProfileRow
                                            label="Blood Type"
                                            value={patient?.bloodType}
                                            onEdit={() => setEditingField("bloodType")}
                                        />
                                    )}

                                    {/* Height */}
                                    {editingField === "heightCm" ? (
                                        <div className="py-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Height (cm)</span>
                                            <InlineEditField
                                                value={patient?.heightCm?.toString() || ""}
                                                type="number"
                                                onSave={(v) => handleSaveField("heightCm", v)}
                                                onCancel={() => setEditingField(null)}
                                            />
                                        </div>
                                    ) : (
                                        <ProfileRow
                                            label="Height"
                                            value={patient?.heightCm ? `${patient.heightCm} cm` : undefined}
                                            onEdit={() => setEditingField("heightCm")}
                                        />
                                    )}

                                    {/* Weight */}
                                    {editingField === "weightKg" ? (
                                        <div className="py-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Weight (kg)</span>
                                            <InlineEditField
                                                value={patient?.weightKg?.toString() || ""}
                                                type="number"
                                                onSave={(v) => handleSaveField("weightKg", v)}
                                                onCancel={() => setEditingField(null)}
                                            />
                                        </div>
                                    ) : (
                                        <ProfileRow
                                            label="Weight"
                                            value={patient?.weightKg ? `${patient.weightKg} kg` : undefined}
                                            onEdit={() => setEditingField("weightKg")}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Conditions Tab */}
                            {activeTab === "conditions" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        {patient?.chronicConditions?.map((condition, index) => (
                                            <ListItem
                                                key={index}
                                                label={condition.condition}
                                                sublabel={condition.status === "active" ? "Active" : condition.status === "managed" ? "Managed" : "In Remission"}
                                                onDelete={() => handleRemoveCondition(index)}
                                            />
                                        ))}
                                        {(!patient?.chronicConditions || patient.chronicConditions.length === 0) && !addingItem && (
                                            <div className="text-center py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl">
                                                <Heart className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                                                <p className="text-sm text-zinc-500 dark:text-zinc-500">No conditions recorded</p>
                                            </div>
                                        )}
                                    </div>

                                    {addingItem === "condition" ? (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <input
                                                type="text"
                                                value={newItemValue}
                                                onChange={(e) => setNewItemValue(e.target.value)}
                                                placeholder="Enter condition name..."
                                                className="flex-1 h-9 px-3 text-[13px] border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                autoFocus
                                                onKeyDown={(e) => e.key === "Enter" && handleAddCondition()}
                                            />
                                            <button
                                                onClick={handleAddCondition}
                                                disabled={!newItemValue.trim()}
                                                className="h-9 w-9 flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => { setAddingItem(null); setNewItemValue(""); }}
                                                className="h-9 w-9 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setAddingItem("condition")}
                                            className="w-full py-2 flex items-center justify-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 transition-all"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add condition
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Allergies Tab */}
                            {activeTab === "allergies" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        {patient?.allergies?.map((allergy, index) => (
                                            <ListItem
                                                key={index}
                                                label={allergy.agent}
                                                sublabel={allergy.severity ? `Severity: ${allergy.severity}` : "Allergy"}
                                                onDelete={() => handleRemoveAllergy(index)}
                                            />
                                        ))}
                                        {(!patient?.allergies || patient.allergies.length === 0) && !addingItem && (
                                            <div className="text-center py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl">
                                                <AlertTriangle className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                                                <p className="text-sm text-zinc-500 dark:text-zinc-500">No allergies recorded</p>
                                            </div>
                                        )}
                                    </div>

                                    {addingItem === "allergy" ? (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <input
                                                type="text"
                                                value={newItemValue}
                                                onChange={(e) => setNewItemValue(e.target.value)}
                                                placeholder="Enter allergy..."
                                                className="flex-1 h-9 px-3 text-[13px] border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                autoFocus
                                                onKeyDown={(e) => e.key === "Enter" && handleAddAllergy()}
                                            />
                                            <button
                                                onClick={handleAddAllergy}
                                                disabled={!newItemValue.trim()}
                                                className="h-9 w-9 flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => { setAddingItem(null); setNewItemValue(""); }}
                                                className="h-9 w-9 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setAddingItem("allergy")}
                                            className="w-full py-2 flex items-center justify-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 transition-all"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add allergy
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Lifestyle Tab */}
                            {activeTab === "lifestyle" && (
                                <div className="space-y-1">
                                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-3">
                                        Social History
                                    </h3>
                                    {editingField === "smokingStatus" ? (
                                        <div className="py-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Smoking Status</span>
                                            <InlineEditField
                                                value={patient?.socialHistory?.smokingStatus || ""}
                                                type="select"
                                                options={[
                                                    { value: "", label: "Not specified" },
                                                    { value: "Never", label: "Never smoked" },
                                                    { value: "Former", label: "Former smoker" },
                                                    { value: "Current", label: "Current smoker" },
                                                ]}
                                                onSave={(v) => handleSaveField("smokingStatus", v)}
                                                onCancel={() => setEditingField(null)}
                                            />
                                        </div>
                                    ) : (
                                        <ProfileRow
                                            label="Smoking Status"
                                            value={patient?.socialHistory?.smokingStatus}
                                            onEdit={() => setEditingField("smokingStatus")}
                                        />
                                    )}

                                    {editingField === "alcoholConsumption" ? (
                                        <div className="py-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Alcohol Consumption</span>
                                            <InlineEditField
                                                value={patient?.socialHistory?.alcoholConsumption || ""}
                                                type="select"
                                                options={[
                                                    { value: "", label: "Not specified" },
                                                    { value: "None", label: "None" },
                                                    { value: "Occasional", label: "Occasional" },
                                                    { value: "Moderate", label: "Moderate" },
                                                    { value: "Heavy", label: "Heavy" },
                                                ]}
                                                onSave={(v) => handleSaveField("alcoholConsumption", v)}
                                                onCancel={() => setEditingField(null)}
                                            />
                                        </div>
                                    ) : (
                                        <ProfileRow
                                            label="Alcohol Consumption"
                                            value={patient?.socialHistory?.alcoholConsumption}
                                            onEdit={() => setEditingField("alcoholConsumption")}
                                        />
                                    )}

                                    {editingField === "occupation" ? (
                                        <div className="py-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Occupation</span>
                                            <InlineEditField
                                                value={patient?.socialHistory?.occupation || ""}
                                                onSave={(v) => handleSaveField("occupation", v)}
                                                onCancel={() => setEditingField(null)}
                                            />
                                        </div>
                                    ) : (
                                        <ProfileRow
                                            label="Occupation"
                                            value={patient?.socialHistory?.occupation}
                                            onEdit={() => setEditingField("occupation")}
                                        />
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// Keep backward compatibility with old name
export { MedicalProfileModal as EditProfileModal };