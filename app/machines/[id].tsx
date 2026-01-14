import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getMachine } from '../../src/services/machineService';
import { addLog, getMachineLogs, deleteLog } from '../../src/services/logService';
import { Machine, MachineLog } from '../../src/types';
import { Ionicons } from "@expo/vector-icons";

export default function MachineDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [machine, setMachine] = useState<Machine | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Settings State (dynamic based on machine fields)
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState('');

    // History
    const [recentLogs, setRecentLogs] = useState<MachineLog[]>([]);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id || typeof id !== 'string') return;
        try {
            const m = await getMachine(id);
            setMachine(m);

            const logs = await getMachineLogs(id, 5);
            setRecentLogs(logs);

            // Pre-fill with last log or defaults
            if (logs.length > 0) {
                const lastLog = logs[0];
                const newSettings: Record<string, string> = {};
                Object.keys(lastLog.settings).forEach(key => {
                    newSettings[key] = String(lastLog.settings[key]);
                });
                setSettings(newSettings);
                if (lastLog.notes) setNotes(lastLog.notes);
            } else if (m) {
                // Init empty
                const newSettings: Record<string, string> = {};
                m.fields.forEach(f => newSettings[f.name] = '');
                setSettings(newSettings);
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load machine");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!machine || !id || typeof id !== 'string') return;

        setSaving(true);
        try {
            await addLog(id, settings, notes);
            Alert.alert("Success", "Workout logged!");
            loadData(); // Reload history
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to save log");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLog = (logId: string) => {
        const confirmDelete = async () => {
            try {
                await deleteLog(logId);
                loadData(); // Refresh list
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Failed to delete log");
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Delete this record?")) {
                confirmDelete();
            }
        } else {
            Alert.alert("Delete Log", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: confirmDelete }
            ]);
        }
    };

    const updateSetting = (field: string, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <ActivityIndicator size="large" color="#3B82F6" className="mt-20" />
            </ScreenWrapper>
        );
    }

    if (!machine) {
        return (
            <ScreenWrapper>
                <Text className="text-white text-xl">Machine not found.</Text>
                <Button title="Go Back" onPress={() => router.back()} className="mt-4" />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="py-4 flex-row justify-between items-center">
                    <View>
                        <Text className="text-white text-3xl font-bold">{machine.name}</Text>
                        {machine.location && <Text className="text-gray-400">{machine.location}</Text>}
                    </View>
                    <View className="flex-row">
                        <Button
                            title="Edit"
                            variant="secondary"
                            onPress={() => router.push(`/machines/edit/${machine.id}`)}
                            className="py-2 px-4 mr-2"
                        />
                        <Button title="Back" variant="secondary" onPress={() => router.back()} className="py-2 px-4" />
                    </View>
                </View>

                <View className="bg-gray-800 p-4 rounded-xl mb-6 border border-gray-700">
                    <Text className="text-blue-400 font-bold mb-4 uppercase text-sm tracking-wider">Current Settings</Text>

                    {machine.fields.map(field => (
                        <Input
                            key={field.id}
                            label={field.name}
                            value={settings[field.name] || ''}
                            onChangeText={(val) => updateSetting(field.name, val)}
                            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                            placeholder={field.type === 'number' ? '0' : 'Setting'}
                        />
                    ))}

                    <Input
                        label="Notes"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={3}
                        placeholder="How did it feel?"
                        className="h-24 text-top"
                    />

                    <Button
                        title="Log Session"
                        onPress={handleSave}
                        loading={saving}
                        className="mt-2"
                    />
                </View>

                {recentLogs.length > 0 && (
                    <View className="mb-10">
                        <Text className="text-white text-xl font-bold mb-4">Recent History</Text>
                        {recentLogs.map((log) => (
                            <View key={log.id} className="bg-gray-800 p-4 rounded-xl mb-3 border border-gray-700 opacity-80">
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-gray-400 text-xs">{new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString()}</Text>
                                    <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row flex-wrap">
                                    {Object.entries(log.settings).map(([key, val]) => (
                                        <View key={key} className="mr-4 mb-2">
                                            <Text className="text-gray-500 text-xs uppercase">{key}</Text>
                                            <Text className="text-white font-medium">{val}</Text>
                                        </View>
                                    ))}
                                </View>
                                {log.notes && <Text className="text-gray-400 text-sm mt-1 italic">"{log.notes}"</Text>}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}
