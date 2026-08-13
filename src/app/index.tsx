import { useState, useEffect } from 'react';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { saveToken, getToken, clearToken } from '@/config/auth';
import SeatMapScreen from './seat-map';

export default function App() {
    const [email, setEmail] = useState('test@example.com');
    const [password, setPassword] = useState('password');
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        checkExistingSession();
    }, []);

    const checkExistingSession = async () => {
        const savedToken = await getToken();

        if (!savedToken) {
            setCheckingSession(false);
            return;
        }

        // verify token masih valid dengan hit protected endpoint
        try {
            await axios.get(`${API_BASE_URL}/movie`, {
                headers: { Authorization: `Bearer ${savedToken}` },
            });
            setToken(savedToken); // token valid, terus masuk app
        } catch (err) {
            await clearToken(); // token expired/invalid, clear dan suruh login balik
        } finally {
            setCheckingSession(false);
        }
    };

    const handleLogin = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
            const newToken = response.data.data.token;

            await saveToken(newToken);
            setToken(newToken);
            setError('');
        } catch (err) {
            setError('Login failed. Check credentials.');
        }
    };

    if (checkingSession) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );
    }

    if (token) {
        return <SeatMapScreen token={token} showtimeId={1} onSessionExpired={handleSessionExpired} />;
    }

    async function handleSessionExpired() {
        await clearToken();
        setToken(null);
        setError('Session expired, please login again.');
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.title}>Cinema Booking Login</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry
                />
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    form: { width: '100%', maxWidth: 400, padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 10, borderRadius: 5 },
    button: { backgroundColor: '#2196F3', padding: 14, borderRadius: 5, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    error: { color: 'red', marginTop: 10, textAlign: 'center' },
});