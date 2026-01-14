import React, { useState } from 'react';
import { View, Text, Alert, TextInput, TouchableOpacity } from "react-native";
import ScreenWrapper from "../src/components/ScreenWrapper";
import Button from "../src/components/Button";
import { useAuth } from "../src/context/AuthContext";
import Input from "../src/components/Input";

export default function LoginScreen() {
    const { signInAnonymously, signInWithEmail, signUpWithEmail, loading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    const handleEmailAuth = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter valid email and password");
            return;
        }

        setLocalLoading(true);
        try {
            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password);
            }
        } catch (error: any) {
            let msg = error.message;
            if (error.code === 'auth/invalid-email') msg = "Invalid email address.";
            if (error.code === 'auth/user-not-found') msg = "No account found with this email.";
            if (error.code === 'auth/wrong-password') msg = "Invalid password.";
            if (error.code === 'auth/email-already-in-use') msg = "Email already in use.";
            Alert.alert("Authentication Error", msg);
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <ScreenWrapper className="justify-center items-center px-4">
            <View className="items-center mb-10">
                <Text className="text-blue-500 text-5xl font-bold mb-2">AG</Text>
                <Text className="text-white text-3xl font-bold text-center">Gym Machine Tracker</Text>
                <Text className="text-gray-400 mt-2 text-center">Track your settings. Stop guessing.</Text>
            </View>

            <View className="w-full max-w-sm">
                <Input
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Input
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="********"
                    secureTextEntry
                />

                <Button
                    title={isLogin ? "Login" : "Sign Up"}
                    onPress={handleEmailAuth}
                    loading={localLoading || loading}
                    className="w-full mt-2"
                />

                <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="mt-4 py-2">
                    <Text className="text-blue-400 text-center">
                        {isLogin ? "Need an account? Sign Up" : "Have an account? Login"}
                    </Text>
                </TouchableOpacity>

                <View className="flex-row items-center my-6">
                    <View className="flex-1 h-px bg-gray-700" />
                    <Text className="text-gray-500 mx-4">OR</Text>
                    <View className="flex-1 h-px bg-gray-700" />
                </View>

                <Button
                    title="Continue as Guest"
                    variant="secondary"
                    onPress={signInAnonymously}
                    loading={loading && !localLoading}
                    className="w-full"
                />
            </View>
        </ScreenWrapper>
    );
}
