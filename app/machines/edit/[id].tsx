import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, Platform } from 'react-native';
import ScreenWrapper from '../../../src/components/ScreenWrapper';
import Input from '../../../src/components/Input';
import Button from '../../../src/components/Button';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getMachine, updateMachine, deleteMachine } from '../../../src/services/machineService';
import { Machine } from '../../../src/types';

export default function EditMachine() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadMachine();
    }, [id]);

    const loadMachine = async () => {
        if (!id || typeof id !== 'string') return;
        try {
            const m = await getMachine(id);
            if (m) {
                setName(m.name);
                setLocation(m.location || '');
            } else {
                Alert.alert("Error", "Machine not found");
                router.back();
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load machine");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Machine name is required");
            return;
        }

        if (!id || typeof id !== 'string') return;

        setSaving(true);
        try {
            await updateMachine(id, { name, location });
            Alert.alert("Success", "Machine updated successfully");
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update machine");
        } finally {
            setSaving(false);
        }
    };

    const performDelete = async () => {
        if (!id || typeof id !== 'string') return;
        setSaving(true);
        try {
            await deleteMachine(id);
            // Optional: User feedback before nav
            // if (Platform.OS === 'web') alert('Machine deleted'); // Can skip to be instant
            router.replace('/');
        } catch (error) {
            console.error(error);
            const msg = "Failed to delete machine";
            if (Platform.OS === 'web') {
                alert(msg);
            } else {
                Alert.alert("Error", msg);
            }
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to delete this machine? This action cannot be undone.")) {
                performDelete();
            }
        } else {
            Alert.alert(
                "Delete Machine",
                "Are you sure you want to delete this machine? This action cannot be undone.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: performDelete
                    }
                ]
            );
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
                <Text className="text-white text-3xl font-bold mb-6">Edit Machine</Text>

                <Input
                    label="Machine Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Leg Press"
                />

                <Input
                    label="Gym / Location"
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g. Main Gym"
                />

                <View className="mt-4">
                    <Button
                        title="Save Changes"
                        onPress={handleSave}
                        loading={saving}
                    />
                    <Button
                        title="Delete Machine"
                        variant="danger"
                        onPress={handleDelete}
                        loading={saving}
                        className="mt-4"
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
