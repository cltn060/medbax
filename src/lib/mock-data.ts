
export interface PatientVital {
    id: string;
    label: string;
    value: string;
    unit: string;
    change?: number; // percentage change
    trend?: 'up' | 'down' | 'neutral';
    status: 'normal' | 'warning' | 'critical';
    lastUpdated: string;
}

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    prescribedBy: string;
    refillsRemaining: number;
    adherence: number; // percentage (0-100)
    startDate: string;
    status: 'active' | 'completed' | 'hold';
}

export interface Condition {
    id: string;
    name: string;
    diagnosedDate: string;
    status: 'active' | 'managed' | 'resolved';
    severity: 'mild' | 'moderate' | 'severe';
    notes?: string;
}

export interface LabResult {
    id: string;
    testName: string;
    value: number;
    unit: string;
    range: string;
    date: string;
    status: 'normal' | 'high' | 'low' | 'critical';
}

export const mockVitals: PatientVital[] = [
    {
        id: '1',
        label: 'Heart Rate',
        value: '72',
        unit: 'bpm',
        change: -2,
        trend: 'down',
        status: 'normal',
        lastUpdated: '10 min ago'
    },
    {
        id: '2',
        label: 'Blood Pressure',
        value: '128/82',
        unit: 'mmHg',
        change: 5,
        trend: 'up',
        status: 'warning', // Slightly elevated
        lastUpdated: '2 hours ago'
    },
    {
        id: '3',
        label: 'Oxygen Saturation',
        value: '98',
        unit: '%',
        change: 0,
        trend: 'neutral',
        status: 'normal',
        lastUpdated: '10 min ago'
    },
    {
        id: '4',
        label: 'Glucose',
        value: '105',
        unit: 'mg/dL',
        change: 8,
        trend: 'up',
        status: 'warning', // Fasting slightly high
        lastUpdated: 'Today, 8:00 AM'
    },
    {
        id: '5',
        label: 'Body Temperature',
        value: '98.4',
        unit: '°F',
        trend: 'neutral',
        status: 'normal',
        lastUpdated: '4 hours ago'
    },
    {
        id: '6',
        label: 'Weight',
        value: '174',
        unit: 'lbs',
        change: -1.2,
        trend: 'down',
        status: 'normal',
        lastUpdated: 'Yesterday'
    }
];

export const mockMedications: Medication[] = [
    {
        id: '1',
        name: 'Lisinopril',
        dosage: '10 mg',
        frequency: 'Once daily',
        prescribedBy: 'Dr. Sarah Chen',
        refillsRemaining: 2,
        adherence: 95,
        startDate: '2024-01-15',
        status: 'active'
    },
    {
        id: '2',
        name: 'Atorvastatin',
        dosage: '20 mg',
        frequency: 'Once daily at bedtime',
        prescribedBy: 'Dr. Sarah Chen',
        refillsRemaining: 1,
        adherence: 88,
        startDate: '2024-03-10',
        status: 'active'
    },
    {
        id: '3',
        name: 'Metformin',
        dosage: '500 mg',
        frequency: 'Twice daily with meals',
        prescribedBy: 'Dr. Michael Ross',
        refillsRemaining: 3,
        adherence: 100,
        startDate: '2024-06-01',
        status: 'active'
    }
];

export const mockConditions: Condition[] = [
    {
        id: '1',
        name: 'Hypertension (Stage 1)',
        diagnosedDate: '2023-11-12',
        status: 'managed',
        severity: 'moderate'
    },
    {
        id: '2',
        name: 'Type 2 Diabetes Mellitus',
        diagnosedDate: '2024-05-20',
        status: 'active',
        severity: 'moderate'
    },
    {
        id: '3',
        name: 'Seasonal Allergies',
        diagnosedDate: '2020-03-15',
        status: 'managed',
        severity: 'mild'
    }
];

export const mockLabs: LabResult[] = [
    {
        id: '1',
        testName: 'Hemoglobin A1c',
        value: 6.8,
        unit: '%',
        range: '< 5.7',
        date: '2024-12-20',
        status: 'high' // Prediabetic/Diabetic range
    },
    {
        id: '2',
        testName: 'LDL Cholesterol',
        value: 115,
        unit: 'mg/dL',
        range: '< 100',
        date: '2024-12-20',
        status: 'high'
    },
    {
        id: '3',
        testName: 'HDL Cholesterol',
        value: 45,
        unit: 'mg/dL',
        range: '> 40',
        date: '2024-12-20',
        status: 'normal'
    },
    {
        id: '4',
        testName: 'Triglycerides',
        value: 145,
        unit: 'mg/dL',
        range: '< 150',
        date: '2024-12-20',
        status: 'normal'
    },
    {
        id: '5',
        testName: 'Complete Blood Count (WBC)',
        value: 7.5,
        unit: 'K/uL',
        range: '4.5 - 11.0',
        date: '2024-12-20',
        status: 'normal'
    }
];

export const aiHealthSummary = {
    title: "Health Status Overview",
    generatedAt: new Date().toISOString(),
    content: "Patient is currently managing Stage 1 Hypertension and Type 2 Diabetes. Recent lab results indicate elevated A1c (6.8%) and LDL (115 mg/dL), suggesting a need for dietary review or medication adjustment. Blood pressure is slightly elevated (128/82 mmHg) but improved from last visit. Adherence to Metformin is excellent (100%), though Atorvastatin adherence (88%) could be improved. Overall risk profile is moderate."
};
