export const defaultMachines = [
    {
        name: "Leg Press",
        fields: [
            { id: '1', name: 'Seat Settings', type: 'number' },
            { id: '2', name: 'Weight', type: 'number' }
        ]
    },
    {
        name: "Chest Press",
        fields: [
            { id: '1', name: 'Seat Height', type: 'number' },
            { id: '2', name: 'Weight', type: 'number' },
            { id: '3', name: 'Handle Position', type: 'selection', options: ['1', '2', '3'] }
        ]
    },
    {
        name: "Lat Pulldown",
        fields: [
            { id: '1', name: 'Thigh Pad', type: 'number' },
            { id: '2', name: 'Weight', type: 'number' },
            { id: '3', name: 'Attachment', type: 'text' }
        ]
    },
    {
        name: "Leg Extension",
        fields: [
            { id: '1', name: 'Back Pad', type: 'number' },
            { id: '2', name: 'Shin Pad', type: 'number' },
            { id: '3', name: 'Weight', type: 'number' }
        ]
    },
    {
        name: "Seated Row",
        fields: [
            { id: '1', name: 'Seat Height', type: 'number' },
            { id: '2', name: 'Chest Pad', type: 'number' },
            { id: '3', name: 'Weight', type: 'number' }
        ]
    }
];
