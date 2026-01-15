import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import ScreenWrapper from "../../../src/components/ScreenWrapper";
import Button from "../../../src/components/Button";
import Input from "../../../src/components/Input";
import { useRouter, useLocalSearchParams } from "expo-router";
import { updateGym, getGyms } from "../../../src/services/gymService";
import { Gym } from "../../../src/types";

export default function EditGym() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadGym();
    }, [id]);

    const loadGym = async () => {
        if (!id || typeof id !== 'string') return;
        try {
            const gyms = await getGyms();
            const gym = gyms.find(g => g.id === id);
            if (gym) {
                setName(gym.name);
            } else {
                Alert.alert("Error", "Gym not found");
                router.back();
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load gym");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !id || typeof id !== 'string') {
            Alert.alert("Error", "Gym name is required");
            return;
        }

        setSaving(true);
        try {
            await updateGym(id, { name });
            Alert.alert("Success", "Gym updated!");
            router.back();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <ActivityIndicator size="large" color="#3B82F6" className="mt-20" />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <View className="py-4">
                <Text className="text-white text-3xl font-bold mb-6">Edit Gym</Text>

                <View className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <Input
                        label="Gym Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Planet Fitness"
                    />

                    <View className="mt-4">
                        <Button
                            title="Save Changes"
                            onPress={handleSave}
                            loading={saving}
                        />
                        <Button
                            title="Cancel"
                            variant="secondary"
                            onPress={() => router.back()}
                            className="mt-4"
                        />
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    );
}
