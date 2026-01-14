import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from "react-native";
import ScreenWrapper from "../../src/components/ScreenWrapper";
import { useRouter, useFocusEffect } from "expo-router";
import Button from "../../src/components/Button";
import { useAuth } from "../../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { getMachines } from "../../src/services/machineService";
import { Machine } from "../../src/types";
import MachineCard from "../../src/components/MachineCard";
import Constants from 'expo-constants';

export default function MachineList() {
    const { logout, user } = useAuth();
    const router = useRouter();
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadMachines = async () => {
        try {
            const data = await getMachines();
            setMachines(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSeed = async () => {
        setLoading(true);
        try {
            const { seedMachines } = await import("../../src/services/machineService");
            await seedMachines();
            loadMachines();
        } catch (error) {
            console.error(error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadMachines();
        }, [user])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadMachines();
    };

    return (
        <ScreenWrapper>
            <View className="flex-row justify-between items-center py-4 mb-2">
                <Text className="text-white text-3xl font-bold">Gym Machines</Text>
                <Ionicons name="log-out-outline" size={24} color="#9CA3AF" onPress={logout} />
            </View>

            <FlatList
                data={machines}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <MachineCard
                        machine={item}
                        onPress={() => router.push(`/machines/${item.id}`)}
                    />
                )}
                ListEmptyComponent={
                    !loading ? (
                        <View className="flex-1 items-center justify-center mt-20">
                            <Text className="text-gray-500 mb-6 text-lg">No machines added yet.</Text>
                            <Button
                                title="Add Your First Machine"
                                onPress={() => router.push("/machines/new")}
                                className="w-full mb-4"
                            />
                            <Button
                                title="Load Default Machines"
                                variant="secondary"
                                onPress={handleSeed}
                                className="w-full"
                            />
                        </View>
                    ) : null
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />
                }
            />

            {machines.length > 0 && (
                <View className="absolute bottom-6 right-6">
                    <Button
                        title="+"
                        onPress={() => router.push("/machines/new")}
                        className="w-16 h-16 rounded-full items-center justify-center shadow-lg"
                    />
                </View>
            )}

            <View className="items-center py-2">
                <Text className="text-gray-600 text-xs">v{Constants.expoConfig?.version}</Text>
            </View>
        </ScreenWrapper>
    );
}
