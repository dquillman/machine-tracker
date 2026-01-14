import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import Dropdown from '../../src/components/Dropdown';
import { useRouter } from 'expo-router';
import { addMachine, getAllUniqueMachineNames } from '../../src/services/machineService';
import { useAuth } from '../../src/context/AuthContext';

export default function AddMachine() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [type, setType] = useState<'strength' | 'treadmill'>('strength');
    const [loading, setLoading] = useState(false);
    const [existingMachines, setExistingMachines] = useState<string[]>([]);
    const [loadingMachines, setLoadingMachines] = useState(true);

    useEffect(() => {
        loadExistingMachines();
    }, []);

    const loadExistingMachines = async () => {
        try {
            const machines = await getAllUniqueMachineNames();

            // If no machines exist and we have an active gym, seed default machines
            if (machines.length === 0 && userProfile?.activeGymId) {
                console.log("No machines found, seeding defaults...");
                const { seedMachines } = await import('../../src/services/machineService');
                await seedMachines(userProfile.activeGymId);

                // Reload machines after seeding
                const refreshedMachines = await getAllUniqueMachineNames();
                setExistingMachines(refreshedMachines);
            } else {
                setExistingMachines(machines);
            }
        } catch (error) {
            console.error("Error loading machines:", error);
        } finally {
            setLoadingMachines(false);
        }
    };

    const handleMachineSelect = (machineName: string) => {
        setName(machineName);
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Machine name is required");
            return;
        }

        if (!userProfile?.activeGymId) {
            Alert.alert("Error", "No Active Gym selected");
            return;
        }

        setLoading(true);
        try {
            await addMachine(userProfile.activeGymId, name, location, type);
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to create machine");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <View className="py-4">
                <Text className="text-white text-3xl font-bold mb-6">New Machine</Text>

                <View className="mb-6 flex-row bg-gray-800 p-1 rounded-xl">
                    <Button
                        title="Strength"
                        onPress={() => setType('strength')}
                        variant={type === 'strength' ? 'primary' : 'secondary'}
                        className="flex-1 mr-1 py-3"
                    />
                    <Button
                        title="Treadmill"
                        onPress={() => setType('treadmill')}
                        variant={type === 'treadmill' ? 'primary' : 'secondary'}
                        className="flex-1 ml-1 py-3"
                    />
                </View>

                {loadingMachines ? (
                    <Text className="text-gray-400 mb-4">Loading existing machines...</Text>
                ) : existingMachines.length > 0 ? (
                    <Dropdown
                        label="Select Existing Machine (Optional)"
                        value=""
                        options={existingMachines}
                        onSelect={handleMachineSelect}
                        placeholder="Choose from your machines..."
                    />
                ) : null}

                <Input
                    label="Machine Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Leg Press"
                />

                <Input
                    label="Gym / Location (Optional)"
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g. Main Gym"
                />

                <View className="mt-4">
                    <Button
                        title="Create Machine"
                        onPress={handleCreate}
                        loading={loading}
                    />
                    <Button
                        title="Cancel"
                        variant="secondary"
                        onPress={() => router.back()}
                        className="mt-4"
                    />
                </View>
            </View>
        </ScreenWrapper>
    );
}
