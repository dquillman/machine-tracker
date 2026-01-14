import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Alert, TouchableOpacity, RefreshControl, Modal, TextInput } from "react-native";
import ScreenWrapper from "../../src/components/ScreenWrapper";
import Button from "../../src/components/Button";
import Input from "../../src/components/Input";
import { useRouter, useFocusEffect } from "expo-router";
import { getGyms, createGym, setActiveGym, deleteGym } from "../../src/services/gymService";
import { useAuth } from "../../src/context/AuthContext";
import { Gym } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";

export default function GymsList() {
    const router = useRouter();
    const { user, userProfile, refreshProfile } = useAuth();
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newGymName, setNewGymName] = useState('');
    const [seedDefaults, setSeedDefaults] = useState(true);
    const [creating, setCreating] = useState(false);

    const loadGyms = async () => {
        setLoading(true);
        const data = await getGyms();
        setGyms(data);
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadGyms();
        }, [])
    );

    const handleCreateGym = async () => {
        if (!newGymName.trim()) return;
        setCreating(true);
        try {
            await createGym(newGymName, seedDefaults);
            await refreshProfile(); // Update active gym in context
            setModalVisible(false);
            setNewGymName('');
            loadGyms();
            Alert.alert("Success", "Gym created!");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setCreating(false);
        }
    };

    const handleSwitchGym = async (gymId: string, gymName: string) => {
        await setActiveGym(gymId);
        await refreshProfile();
        Alert.alert("Switched Gym", `Active gym: ${gymName}`);
        router.back();
    };

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [gymToDelete, setGymToDelete] = useState<{ id: string; name: string } | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handleDeleteGym = (gymId: string, gymName: string) => {
        setGymToDelete({ id: gymId, name: gymName });
        setDeleteConfirmText('');
        setDeleteModalVisible(true);
    };

    const confirmDeleteGym = async () => {
        if (!gymToDelete) return;

        if (deleteConfirmText !== gymToDelete.name) {
            Alert.alert("Error", "Gym name doesn't match. Please type the exact gym name to confirm.");
            return;
        }

        setDeleting(true);
        try {
            await deleteGym(gymToDelete.id);
            setDeleteModalVisible(false);
            setGymToDelete(null);
            setDeleteConfirmText('');
            loadGyms();
            Alert.alert("Deleted", "Gym has been deleted.");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <ScreenWrapper>
            <View className="py-4 flex-row justify-between items-center">
                <Text className="text-white text-3xl font-bold">My Gyms</Text>
                <Button title="New Gym" size="sm" onPress={() => setModalVisible(true)} />
            </View>

            <FlatList
                data={gyms}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className={`p-4 rounded-xl mb-3 border ${userProfile?.activeGymId === item.id ? 'bg-blue-900 border-blue-500' : 'bg-gray-800 border-gray-700'}`}
                        onPress={() => handleSwitchGym(item.id, item.name)}
                    >
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="text-white font-bold text-lg">{item.name}</Text>
                                {userProfile?.activeGymId === item.id && <Text className="text-blue-400 text-xs uppercase font-bold mt-1">Active</Text>}
                            </View>
                            <TouchableOpacity onPress={() => handleDeleteGym(item.id, item.name)}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadGyms} tintColor="#fff" />}
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/80 p-4">
                    <View className="bg-gray-900 w-full max-w-sm p-6 rounded-2xl border border-gray-700">
                        <Text className="text-white text-xl font-bold mb-4">Add New Gym</Text>

                        <Input
                            label="Gym Name"
                            value={newGymName}
                            onChangeText={setNewGymName}
                            placeholder="e.g. Planet Fitness"
                        />

                        <View className="flex-row items-center mb-6">
                            <TouchableOpacity
                                className={`w-6 h-6 rounded border ${seedDefaults ? 'bg-blue-500 border-blue-500' : 'border-gray-500'} mr-3 justify-center items-center`}
                                onPress={() => setSeedDefaults(!seedDefaults)}
                            >
                                {seedDefaults && <Ionicons name="checkmark" size={16} color="white" />}
                            </TouchableOpacity>
                            <Text className="text-gray-300 flex-1">Seed default machines from my latest settings</Text>
                        </View>

                        <Button
                            title="Create Gym"
                            onPress={handleCreateGym}
                            loading={creating}
                            className="mb-3"
                        />
                        <Button
                            title="Cancel"
                            variant="secondary"
                            onPress={() => setModalVisible(false)}
                        />
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={deleteModalVisible}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/80 p-4">
                    <View className="bg-gray-900 w-full max-w-sm p-6 rounded-2xl border-2 border-red-600">
                        <View className="items-center mb-4">
                            <Ionicons name="warning" size={64} color="#EF4444" />
                        </View>

                        <Text className="text-red-500 text-2xl font-bold text-center mb-2">⚠️ DANGER ⚠️</Text>
                        <Text className="text-white text-xl font-bold text-center mb-4">Delete Gym</Text>

                        <View className="bg-red-900/30 border border-red-600 rounded-xl p-4 mb-4">
                            <Text className="text-red-400 font-bold mb-2">WARNING:</Text>
                            <Text className="text-red-300 mb-2">This action CANNOT be undone!</Text>
                            <Text className="text-gray-300 text-sm">
                                Deleting "{gymToDelete?.name}" will permanently remove:
                            </Text>
                            <Text className="text-gray-300 text-sm ml-2 mt-1">• All machines in this gym</Text>
                            <Text className="text-gray-300 text-sm ml-2">• All workout logs and history</Text>
                            <Text className="text-gray-300 text-sm ml-2">• All settings and configurations</Text>
                        </View>

                        <Text className="text-gray-300 mb-2 font-medium">
                            Type the gym name to confirm:
                        </Text>
                        <Text className="text-white font-bold mb-2 text-center bg-gray-800 p-2 rounded">
                            {gymToDelete?.name}
                        </Text>

                        <Input
                            label=""
                            value={deleteConfirmText}
                            onChangeText={setDeleteConfirmText}
                            placeholder="Type gym name here"
                        />

                        <Button
                            title="DELETE PERMANENTLY"
                            onPress={confirmDeleteGym}
                            loading={deleting}
                            className="mb-3 bg-red-600"
                        />
                        <Button
                            title="Cancel"
                            variant="secondary"
                            onPress={() => {
                                setDeleteModalVisible(false);
                                setGymToDelete(null);
                                setDeleteConfirmText('');
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
}
