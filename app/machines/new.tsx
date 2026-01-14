import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { useRouter } from 'expo-router';
import { addMachine } from '../../src/services/machineService';

export default function AddMachine() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [type, setType] = useState<'strength' | 'treadmill'>('strength');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Machine name is required");
            return;
        }

        setLoading(true);
        try {
            await addMachine(name, location, type);
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
