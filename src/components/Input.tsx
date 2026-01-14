import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
    return (
        <View className="mb-4">
            {label && <Text className="text-gray-400 mb-1 font-medium">{label}</Text>}
            <TextInput
                placeholderTextColor="#9CA3AF"
                className={`bg-gray-800 text-white p-4 rounded-xl text-lg border border-gray-700 focus:border-blue-500 ${className}`}
                {...props}
            />
            {error && <Text className="text-red-500 mt-1">{error}</Text>}
        </View>
    );
}
