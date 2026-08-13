import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { createEcho } from '../config/echo';

type Seat = {
    id: number;
    seat_row: string;
    seat_number: number;
    seat_type: string;
    status: 'available' | 'locked' | 'booked';
};

type SeatMapScreenProps = {
    token: string;
    showtimeId: number;
    onSessionExpired: () => void;

};
export default function SeatMapScreen({ token, showtimeId, onSessionExpired }: SeatMapScreenProps) {
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const fetchSeats = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/showtimes/${showtimeId}/seats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSeats(response.data.data);
        } catch (err: any) {
            if (err.response?.status === 401) {
                onSessionExpired();
                return;
            }
            console.error('Failed to fetch seats', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeats();

        const echo = createEcho(token);
        if (!echo) return; // guard kalau echo tak dapat initialize (SSR)

        const channel = echo.channel(`showtime.${showtimeId}`);

        channel.listen('.seat.locked', (data: { seat_id: number }) => {
            updateSeatStatus(data.seat_id, 'locked');
        });

        channel.listen('.seat.unlocked', (data: { seat_id: number }) => {
            updateSeatStatus(data.seat_id, 'available');
        });

        channel.listen('.seat.booked', (data: { seat_id: number }) => {
            updateSeatStatus(data.seat_id, 'booked');
        });

        return () => {
            echo.leaveChannel(`showtime.${showtimeId}`);
        };
    }, []);

    const updateSeatStatus = (seatId: number, status: Seat['status']) => {
        setSeats((prev) =>
            prev.map((seat) => (seat.id === seatId ? { ...seat, status } : seat))
        );
    };

    const handleSeatPress = async (seat: Seat) => {
        if (seat.status === 'booked') {
            setErrorMessage('This seat is already booked.');
            return;
        }
        if (seat.status === 'locked') {
            setErrorMessage('This seat is currently locked by another user.');
            return;
        }

        try {
            await axios.post(
                `${API_BASE_URL}/showtimes/${showtimeId}/seats/${seat.id}/lock`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            updateSeatStatus(seat.id, 'locked');
            setErrorMessage('');
        } catch (err: any) {
            if (err.response?.status === 401) {
                onSessionExpired();
                return;
            }
            setErrorMessage(err.response?.data?.message || 'Failed to lock seat');
        }
    };

    if (loading) return <Text style={styles.loading}>Loading seats...</Text>;

    const seatsByRow = seats.reduce<Record<string, Seat[]>>((acc, seat) => {
        acc[seat.seat_row] = acc[seat.seat_row] || [];
        acc[seat.seat_row].push(seat);
        return acc;
    }, {});

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Select Your Seat</Text>
            <Text style={styles.screen}>SCREEN</Text>
            {errorMessage ? (
                <TouchableOpacity onPress={() => setErrorMessage('')}>
                    <Text style={styles.errorBanner}>{errorMessage}</Text>
                </TouchableOpacity>
            ) : null}

            {Object.keys(seatsByRow).sort().map((row) => (
                <View key={row} style={styles.row}>
                    <Text style={styles.rowLabel}>{row}</Text>
                    {seatsByRow[row].map((seat) => (
                        <TouchableOpacity
                            key={seat.id}
                            style={[
                                styles.seat,
                                seat.status === 'available' && styles.available,
                                seat.status === 'locked' && styles.locked,
                                seat.status === 'booked' && styles.booked,
                            ]}
                            onPress={() => handleSeatPress(seat)}
                        >
                            <Text style={styles.seatText}>{seat.seat_number}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}

            <View style={styles.legend}>
                <View style={styles.legendItem}><View style={[styles.dot, styles.available]} /><Text>Available</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, styles.locked]} /><Text>Locked</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, styles.booked]} /><Text>Booked</Text></View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    loading: { textAlign: 'center', marginTop: 50 },
    title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    screen: { textAlign: 'center', backgroundColor: '#333', color: '#fff', padding: 8, marginBottom: 20, borderRadius: 5 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'center' },
    rowLabel: { width: 20, fontWeight: 'bold' },
    seat: { width: 32, height: 32, margin: 3, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
    available: { backgroundColor: '#4CAF50' },
    locked: { backgroundColor: '#FF9800' },
    booked: { backgroundColor: '#9E9E9E' },
    seatText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 20 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dot: { width: 16, height: 16, borderRadius: 8 },
    errorBanner: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600',
},
});