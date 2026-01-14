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
    location?: string; // Optional gym location
    fields: MachineField[];
    lastUsed?: number; // timestamp
    isArchived?: boolean;
}

export interface MachineLog {
    id: string;
    machineId: string;
    userId: string;
    date: number; // timestamp
    settings: Record<string, string | number>; // fieldId -> value
    notes?: string;
}

export interface UserPreferences {
    darkMode: boolean;
    defaultGym?: string;
}
