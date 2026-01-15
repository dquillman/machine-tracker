import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Alert, Platform, TouchableOpacity } from "react-native";
import ScreenWrapper from "../../src/components/ScreenWrapper";
import { useFocusEffect } from "expo-router";
import { getAllLogs, deleteLog } from "../../src/services/logService";
import { MachineLog } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";

export default function History() {
    const [logs, setLogs] = useState<MachineLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadHistory = async () => {
        try {
            const data = await getAllLogs();
            setLogs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    const handleDelete = (item: MachineLog) => {
        const confirmDelete = async () => {
            if (!item.gymId || !item.machineId) return;
            try {
                await deleteLog(item.gymId, item.machineId, item.id);
                loadHistory(); // Refresh list
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Failed to delete log");
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Delete this session record?")) {
                confirmDelete();
            }
        } else {
            Alert.alert("Delete Session", "Are you sure you want to delete this record?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: confirmDelete }
            ]);
        }
    };

    return (
        <ScreenWrapper>
            <View className="py-4 mb-2">
                <Text className="text-white text-3xl font-bold">History</Text>
            </View>

            <FlatList
                data={logs}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View className="bg-gray-800 p-4 rounded-xl mb-3 border border-gray-700 relative">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-400 text-xs">{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}</Text>
                            <TouchableOpacity onPress={() => handleDelete(item)}>
                                <Text className="text-lg">🗑️</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row flex-wrap">
                            {Object.entries(item.settings).map(([key, val]) => (
                                <View key={key} className="mr-4 mb-2">
                                    <Text className="text-gray-500 text-xs uppercase">{key}</Text>
                                    <Text className="text-white font-medium">{val}</Text>
                                </View>
                            ))}
                        </View>
                        {item.notes && <Text className="text-gray-400 text-xs mt-1 italic">"{item.notes}"</Text>}
                    </View>
                )}
                ListEmptyComponent={!loading ? <Text className="text-gray-500 text-center mt-10">No workout history found.</Text> : null}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} tintColor="#fff" />
                }
            />
        </ScreenWrapper>
    );
}
