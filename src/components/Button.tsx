import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    className?: string;
}

export default function Button({ title, onPress, variant = 'primary', size = 'md', loading = false, className = '' }: ButtonProps) {
    let bgClass = 'bg-blue-600';
    let textClass = 'text-white';
    let sizeClass = 'py-4 px-6 text-lg';

    if (variant === 'secondary') {
        bgClass = 'bg-gray-700';
        textClass = 'text-gray-200';
    } else if (variant === 'danger') {
        bgClass = 'bg-red-600';
    }

    if (size === 'sm') {
        sizeClass = 'py-2 px-4 text-sm';
    } else if (size === 'lg') {
        sizeClass = 'py-5 px-8 text-xl';
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading}
            className={`rounded-xl items-center justify-center active:opacity-80 ${bgClass} ${sizeClass} ${className}`}
        >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text className={`font-bold ${textClass}`}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}
