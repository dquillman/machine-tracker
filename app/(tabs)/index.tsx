import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert } from "react-native";
import ScreenWrapper from "../../src/components/ScreenWrapper";
import { useRouter, useFocusEffect } from "expo-router";
import Button from "../../src/components/Button";
import { useAuth } from "../../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { getMachines, checkAndMigrate } from "../../src/services/machineService";
import { getGyms } from "../../src/services/gymService";
import { Machine, Gym } from "../../src/types";
import MachineCard from "../../src/components/MachineCard";
import Constants from 'expo-constants';

export default function MachineList() {
    const { logout, user, userProfile, refreshProfile } = useAuth();
    const router = useRouter();
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeGymName, setActiveGymName] = useState('Loading...');

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
            // Fetch Gym Name (could cache this in profile or separate context, but fetching list is fast enough)
            const gyms = await getGyms();
            const currentGym = gyms.find(g => g.id === userProfile.activeGymId);
            setActiveGymName(currentGym?.name || 'Unknown Gym');

            // Fetch Machines
            const data = await getMachines(userProfile.activeGymId);
            setMachines(data);
        } catch (error) {
            console.error(error);
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

    return (
        <ScreenWrapper>
            <View className="flex-row justify-between items-center py-4 mb-2">
                <View>
                    <Text className="text-gray-400 text-xs uppercase font-bold tracking-wider">Current Gym</Text>
                    <TouchableOpacity onPress={() => router.push("/gyms")}>
                        <View className="flex-row items-center">
                            <Text className="text-white text-2xl font-bold mr-2">{activeGymName}</Text>
                            <Ionicons name="chevron-down" size={20} color="#3B82F6" />
                        </View>
                    </TouchableOpacity>
                </View>
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
                <Text className="text-gray-600 text-xs">v{Constants.expoConfig?.version}</Text>
            </View>
        </ScreenWrapper>
    );
}
