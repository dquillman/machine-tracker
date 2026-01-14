import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    loading?: boolean;
    className?: string;
}

export default function Button({ title, onPress, variant = 'primary', loading = false, className = '' }: ButtonProps) {
    let bgClass = 'bg-blue-600';
    let textClass = 'text-white';

    if (variant === 'secondary') {
        bgClass = 'bg-gray-700';
        textClass = 'text-gray-200';
    } else if (variant === 'danger') {
        bgClass = 'bg-red-600';
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading}
            className={`py-4 px-6 rounded-xl items-center justify-center active:opacity-80 ${bgClass} ${className}`}
        >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text className={`font-bold text-lg ${textClass}`}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}
