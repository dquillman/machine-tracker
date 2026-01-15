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
    const maxLog = normalizedLogs.length > 0 ? normalizedLogs.reduce((prev, curr) => (curr.weightNormalizedLb! > prev.weightNormalizedLb!) ? curr : prev) : null;
    const maxWeight = maxLog?.weightNormalizedLb || 0;
    const lastWeight = normalizedLogs.length > 0 ? normalizedLogs[normalizedLogs.length - 1].weightNormalizedLb : 0;
    const avgWeight = normalizedLogs.length > 0 ? Math.round(normalizedLogs.reduce((sum, l) => sum + (l.weightNormalizedLb || 0), 0) / normalizedLogs.length) : 0;
    const totalSessions = logs.length;

    // 30-day change
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentLogs = normalizedLogs.filter(l => l.date >= thirtyDaysAgo);
    const monthChange = recentLogs.length > 1 ? (recentLogs[recentLogs.length - 1].weightNormalizedLb! - recentLogs[0].weightNormalizedLb!) : 0;

    return (
        <ScreenWrapper>
            <View className="py-4 flex-row justify-between items-center">
                <View>
                    <Text className="text-white text-3xl font-bold">{name || 'Progress'}</Text>
                    <Text className="text-gray-400 text-xs uppercase tracking-widest font-bold">Cross-Gym Analytics</Text>
                </View>
                <Button title="Back" size="sm" variant="secondary" onPress={() => router.back()} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {normalizedLogs.length > 1 ? (
                    <View className="mb-6 items-center bg-gray-800/50 p-4 rounded-3xl border border-gray-700">
                        <LineChart
                            data={chartData}
                            width={screenWidth - 64}
                            height={220}
                            chartConfig={{
                                backgroundColor: "transparent",
                                backgroundGradientFrom: "#1F2937",
                                backgroundGradientTo: "#1F2937",
                                backgroundGradientFromOpacity: 0,
                                backgroundGradientToOpacity: 0,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                                style: {
                                    borderRadius: 16
                                },
                                propsForDots: {
                                    r: "4",
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
                    <View className="p-10 bg-gray-800/50 rounded-3xl mb-6 border border-gray-700 border-dashed items-center">
                        <Text className="text-5xl mb-4">📊</Text>
                        <Text className="text-white font-bold text-lg mb-2">Not Enough Data</Text>
                        <Text className="text-gray-400 text-center">Log at least 2 sessions with valid weights to see your progress chart.</Text>
                    </View>
                )}

                <View className="flex-row flex-wrap justify-between mb-2">
                    <View className="bg-blue-900/20 p-4 rounded-2xl w-[48%] mb-4 border border-blue-500/30">
                        <Text className="text-blue-400 text-[10px] uppercase font-bold mb-1">Personal Best</Text>
                        <Text className="text-white text-2xl font-black">{maxWeight} <Text className="text-xs text-gray-500 font-normal">lbs</Text></Text>
                        {maxLog && <Text className="text-gray-500 text-[10px] mt-1">{new Date(maxLog.date).toLocaleDateString()}</Text>}
                    </View>

                    <View className="bg-gray-800 p-4 rounded-2xl w-[48%] mb-4 border border-gray-700">
                        <Text className="text-gray-400 text-[10px] uppercase font-bold mb-1">Average</Text>
                        <Text className="text-white text-2xl font-black">{avgWeight} <Text className="text-xs text-gray-500 font-normal">lbs</Text></Text>
                        <Text className="text-gray-500 text-[10px] mt-1">All sessions</Text>
                    </View>

                    <View className="bg-gray-800 p-4 rounded-2xl w-[48%] mb-4 border border-gray-700">
                        <Text className="text-gray-400 text-[10px] uppercase font-bold mb-1">30-Day Change</Text>
                        <View className="flex-row items-baseline">
                            <Text className={`text-2xl font-black ${monthChange > 0 ? 'text-green-400' : monthChange < 0 ? 'text-red-400' : 'text-white'}`}>
                                {monthChange > 0 ? '+' : ''}{monthChange}
                            </Text>
                            <Text className="text-xs text-gray-500 font-normal ml-1">lbs</Text>
                        </View>
                        <Text className="text-gray-500 text-[10px] mt-1">Last 30 days</Text>
                    </View>

                    <View className="bg-gray-800 p-4 rounded-2xl w-[48%] mb-4 border border-gray-700">
                        <Text className="text-gray-400 text-[10px] uppercase font-bold mb-1">Sessions</Text>
                        <Text className="text-white text-2xl font-black">{totalSessions}</Text>
                        <Text className="text-gray-500 text-[10px] mt-1">Total lifetime</Text>
                    </View>
                </View>

                {logs.length > 0 && (
                    <View className="mt-4">
                        <Text className="text-white text-xl font-bold mb-4">Detailed History</Text>
                        {logs.map((log) => (
                            <View key={log.id} className="bg-gray-800/40 p-4 rounded-2xl mb-3 border border-gray-700/50">
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-gray-500 text-[10px] font-bold uppercase">{new Date(log.date).toLocaleDateString()}</Text>
                                    <View className="bg-gray-700/50 px-2 py-0.5 rounded-full">
                                        <Text className="text-[9px] text-gray-400 font-medium">{log.machineNameSnapshot}</Text>
                                    </View>
                                </View>
                                <View className="flex-row items-baseline">
                                    <Text className="text-white text-lg font-bold mr-2">
                                        {log.weightRaw || log.settings['Weight'] || log.settings['weight'] || '-'}
                                    </Text>
                                    {log.weightNormalizedLb && (
                                        <View className="bg-blue-500/10 px-1.5 rounded">
                                            <Text className="text-blue-400 text-[10px] font-bold">{log.weightNormalizedLb} lbs</Text>
                                        </View>
                                    )}
                                </View>
                                {log.notes && (
                                    <View className="mt-2 border-t border-gray-700/30 pt-2">
                                        <Text className="text-gray-400 text-xs italic">"{log.notes}"</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}
