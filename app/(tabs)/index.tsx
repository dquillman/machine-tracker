import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, RefreshControl, TouchableOpacity, Alert } from "react-native";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ScreenWrapper from "../../src/components/ScreenWrapper";
import { useRouter, useFocusEffect } from "expo-router";
import Button from "../../src/components/Button";
import { useAuth } from "../../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { getMachines, checkAndMigrate, updateMachinesOrder } from "../../src/services/machineService";
import { getGyms } from "../../src/services/gymService";
import { getLatestLogForMachine } from "../../src/services/logService";
import { Machine } from "../../src/types";
import MachineCard from "../../src/components/MachineCard";
import Constants from 'expo-constants';

export default function MachineList() {
    const { logout, user, userProfile, refreshProfile } = useAuth();
    const router = useRouter();
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeGymName, setActiveGymName] = useState('Loading...');
    const [latestSettings, setLatestSettings] = useState<Map<string, Record<string, string | number> | null>>(new Map());

    // Migration Check
    useEffect(() => {
        if (user && !userProfile?.migrationComplete) {
            checkAndMigrate().then(() => refreshProfile());
        }
    }, [user, userProfile]);

    const loadData = async () => {
        if (!userProfile?.activeGymId) {
            setLoading(false);
            return;
        }
        try {
            const gyms = await getGyms();
            const currentGym = gyms.find(g => g.id === userProfile.activeGymId);
            setActiveGymName(currentGym?.name || 'Unknown Gym');

            const data = await getMachines(userProfile.activeGymId);
            console.log(`[MachineList] Loaded ${data.length} machines for gym: ${userProfile.activeGymId}`);
            console.log(`[MachineList] Machine names:`, data.map(m => `${m.name} (${m.id})`));
            setMachines(data);

            // Fetch latest settings for each machine
            const settingsMap = new Map<string, Record<string, string | number> | null>();
            console.log(`[MachineList] Fetching latest settings for ${data.length} machines...`);
            await Promise.all(
                data.map(async (machine) => {
                    console.log(`[MachineList] Querying settings for: ${machine.name} (machineKey: "${machine.machineKey}")`);
                    const latestLog = await getLatestLogForMachine(machine.machineKey);
                    settingsMap.set(machine.id, latestLog?.settings || null);
                    console.log(`[MachineList] Settings for ${machine.name}:`, latestLog?.settings || 'none');
                })
            );
            setLatestSettings(settingsMap);
        } catch (error) {
            console.error("[MachineList] Error loading data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [userProfile?.activeGymId])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        refreshProfile().then(() => loadData());
    };

    const handleDragEnd = async ({ data }: { data: Machine[] }) => {
        setMachines(data);
        if (userProfile?.activeGymId) {
            try {
                const machineOrders = data.map((m, index) => ({ id: m.id, order: index }));
                await updateMachinesOrder(userProfile.activeGymId, machineOrders);
            } catch (error) {
                console.error("Failed to update machine order:", error);
                Alert.alert("Error", "Failed to save new order.");
            }
        }
    };

    const renderItem = ({ item, drag, isActive }: RenderItemParams<Machine>) => {
        console.log(`[MachineList] Rendering machine: ${item.name} (ID: ${item.id})`);
        return (
            <ScaleDecorator>
                <MachineCard
                    machine={item}
                    onPress={() => router.push(`/machines/${item.id}`)}
                    onLongPress={drag}
                    disabled={isActive}
                    latestSettings={latestSettings.get(item.id)}
                />
            </ScaleDecorator>
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ScreenWrapper>
                <View className="flex-row justify-between items-center py-4 mb-2">
                    <View>
                        <Text className="text-gray-400 text-xs uppercase font-bold tracking-wider">Current Gym</Text>
                        <TouchableOpacity onPress={() => router.push("/gyms")}>
                            <View className="flex-row items-center">
                                <Text className="text-white text-2xl font-bold mr-2">{activeGymName}</Text>
                                <Text className="text-blue-400 text-lg ml-1">🔽</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={logout}>
                        <Text className="text-xl">🚪</Text>
                    </TouchableOpacity>
                </View>

                <DraggableFlatList
                    data={machines}
                    onDragEnd={handleDragEnd}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    containerStyle={{ flex: 1 }}
                    ListEmptyComponent={
                        !loading ? (
                            <View className="flex-1 items-center justify-center mt-20">
                                <Text className="text-gray-500 mb-6 text-lg">No machines in this gym.</Text>
                                <Button
                                    title="Add Machine"
                                    onPress={() => router.push("/machines/new")}
                                    className="w-full mb-4"
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
                    <Text className="text-gray-600 text-xs text-center">v1.2.0</Text>
                </View>
            </ScreenWrapper>
        </GestureHandlerRootView>
    );
}
