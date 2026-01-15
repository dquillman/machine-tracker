export interface MachineField {
    id: string;
    name: string; // e.g. "Seat Height"
    type: 'number' | 'text' | 'selection';
    options?: string[]; // For selection
    defaultValue?: string | number;
}

export interface Machine {
    id: string;
    userId: string;
    name: string;
    machineKey: string; // slug for cross-gym identity
    location?: string; // Optional gym location
    fields: MachineField[];
    lastUsed?: number; // timestamp
    isArchived?: boolean;
    order?: number;
}

export interface MachineLog {
    id: string;
    machineId: string;
    gymId?: string;
    machineKey?: string;
    userId: string;
    date: number; // timestamp
    settings: Record<string, string | number>; // fieldId -> value
    notes?: string;
    // Flattened / Normalized Data for Charts
    weightRaw?: string;
    weightValue?: number;
    weightUnit?: string;
    weightNormalizedLb?: number;
    machineNameSnapshot?: string;
}

export interface UserPreferences {
    darkMode: boolean;
    defaultGym?: string;
}

export interface Gym {
    id: string;
    userId: string;
    name: string;
    address?: string;
    createdAt: number;
    updatedAt: number;
}

export interface UserProfile {
    uid: string;
    activeGymId?: string;
    lastUsedGymId?: string;
    migrationComplete?: boolean;
    latestSettingsTemplate?: Record<string, Record<string, string | number>>; // machineKey -> settings
}
