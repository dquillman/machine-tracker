import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';

interface DropdownProps {
    label: string;
    value: string;
    options: string[];
    onSelect: (value: string) => void;
    placeholder?: string;
}

export default function Dropdown({ label, value, options, onSelect, placeholder = "Select..." }: DropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSelect = (option: string) => {
        onSelect(option);
        setIsOpen(false);
    };

    return (
        <View className="mb-4">
            <Text className="text-gray-300 mb-2 text-sm font-medium">{label}</Text>

            <TouchableOpacity
                onPress={() => setIsOpen(true)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-4"
            >
                <Text className={value ? "text-white" : "text-gray-500"}>
                    {value || placeholder}
                </Text>
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/80 justify-center items-center"
                    activeOpacity={1}
                    onPress={() => setIsOpen(false)}
                >
                    <View className="bg-gray-800 rounded-2xl w-full max-w-sm mx-4 border border-gray-700">
                        <View className="p-4 border-b border-gray-700">
                            <Text className="text-white text-lg font-bold">{label}</Text>
                        </View>

                        <ScrollView className="max-h-96">
                            {options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => handleSelect(option)}
                                    className="px-4 py-4 border-b border-gray-700"
                                >
                                    <Text className={option === value ? "text-blue-400 font-medium" : "text-white"}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => setIsOpen(false)}
                            className="p-4 border-t border-gray-700"
                        >
                            <Text className="text-gray-400 text-center">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
