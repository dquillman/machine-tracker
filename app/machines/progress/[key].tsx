import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import ScreenWrapper from '../../../src/components/ScreenWrapper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getChartData } from '../../../src/services/logService';
import { MachineLog } from '../../../src/types';
import { LineChart } from "react-native-chart-kit";
import Button from '../../../src/components/Button';
import { Ionicons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

export default function ProgressScreen() {
    const { key, name } = useLocalSearchParams(); // key is machineKey
    const router = useRouter();
    const [logs, setLogs] = useState<MachineLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (key) loadData();
    }, [key]);

    const loadData = async () => {
        try {
            const data = await getChartData(String(key));
            setLogs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <ActivityIndicator size="large" color="#3B82F6" className="mt-20" />
            </ScreenWrapper>
        );
    }

    // Prepare Chart Data
    const normalizedLogs = logs.filter(l => l.weightNormalizedLb !== undefined);
    const chartData = {
        labels: normalizedLogs.map(l => new Date(l.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })),
        datasets: [
            {
                data: normalizedLogs.map(l => l.weightNormalizedLb || 0),
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ["Weight (lbs)"]
    };

    // Stats
    const maxWeight = normalizedLogs.length > 0 ? Math.max(...normalizedLogs.map(l => l.weightNormalizedLb || 0)) : 0;
    const lastWeight = normalizedLogs.length > 0 ? normalizedLogs[normalizedLogs.length - 1].weightNormalizedLb : 0;
    const totalSessions = logs.length;

    return (
        <ScreenWrapper>
            <View className="py-4 flex-row justify-between items-center">
                <View>
                    <Text className="text-white text-3xl font-bold">{name || 'Progress'}</Text>
                    <Text className="text-gray-400 text-xs">Cross-Gym Analytics</Text>
                </View>
                <Button title="Back" size="sm" variant="secondary" onPress={() => router.back()} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {normalizedLogs.length > 1 ? (
                    <View className="mb-6 items-center">
                        <LineChart
                            data={chartData}
                            width={screenWidth - 32}
                            height={220}
                            chartConfig={{
                                backgroundColor: "#1F2937",
                                backgroundGradientFrom: "#1F2937",
                                backgroundGradientTo: "#1F2937",
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                                style: {
                                    borderRadius: 16
                                },
                                propsForDots: {
                                    r: "6",
                                    strokeWidth: "2",
                                    stroke: "#3B82F6"
                                }
                            }}
                            bezier
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                        />
                    </View>
                ) : (
                    <View className="p-6 bg-gray-800 rounded-xl mb-6 border border-gray-700 items-center">
                        <Ionicons name="stats-chart" size={48} color="#4B5563" />
                        <Text className="text-gray-400 mt-2 text-center">Not enough data for chart. Log at least 2 sessions with valid weights (lb/kg).</Text>
                    </View>
                )}

                <View className="flex-row justify-between mb-6">
                    <View className="bg-gray-800 p-4 rounded-xl flex-1 mr-2 border border-gray-700 items-center">
                        <Text className="text-gray-400 text-xs uppercase font-bold">Max Weight</Text>
                        <Text className="text-white text-2xl font-bold">{maxWeight} <Text className="text-sm text-gray-500">lbs</Text></Text>
                    </View>
                    <View className="bg-gray-800 p-4 rounded-xl flex-1 mx-1 border border-gray-700 items-center">
                        <Text className="text-gray-400 text-xs uppercase font-bold">Last</Text>
                        <Text className="text-white text-2xl font-bold">{lastWeight} <Text className="text-sm text-gray-500">lbs</Text></Text>
                    </View>
                    <View className="bg-gray-800 p-4 rounded-xl flex-1 ml-2 border border-gray-700 items-center">
                        <Text className="text-gray-400 text-xs uppercase font-bold">Sessions</Text>
                        <Text className="text-white text-2xl font-bold">{totalSessions}</Text>
                    </View>
                </View>

                {logs.length > 0 && (
                    <View>
                        <Text className="text-white text-xl font-bold mb-4">Log History</Text>
                        {logs.map((log) => (
                            <View key={log.id} className="bg-gray-800 p-4 rounded-xl mb-3 border border-gray-700">
                                <View className="flex-row justify-between mb-1">
                                    <Text className="text-gray-400 text-xs">{new Date(log.date).toLocaleDateString()}</Text>
                                    <View className="bg-gray-700 px-2 rounded">
                                        <Text className="text-xs text-gray-300">{log.machineNameSnapshot}</Text>
                                    </View>
                                </View>
                                <View className="flex-row items-end">
                                    <Text className="text-white text-lg font-bold mr-2">
                                        {log.weightRaw || log.settings['Weight'] || log.settings['weight'] || '-'}
                                    </Text>
                                    {log.weightNormalizedLb && (
                                        <Text className="text-blue-400 text-xs mb-1">({log.weightNormalizedLb} lbs)</Text>
                                    )}
                                </View>
                                {log.notes && <Text className="text-gray-500 text-sm italic mt-1">"{log.notes}"</Text>}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}
