import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
    return (
        <SafeAreaView className="flex-1 items-center justify-center bg-gray-900">
            <Text className="text-white text-3xl font-bold">Gym Machine Tracker</Text>
            <Text className="text-gray-400 mt-2">Start your session</Text>
        </SafeAreaView>
    );
}
