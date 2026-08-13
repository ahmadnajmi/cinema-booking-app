import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { REVERB_HOST, REVERB_PORT, REVERB_KEY } from './api';

export const createEcho = (token) => {
    if (typeof window === 'undefined') {
        return null;
    }

    window.Pusher = Pusher;

    return new Echo({
        broadcaster: 'reverb',
        key: REVERB_KEY,
        wsHost: REVERB_HOST,
        wsPort: REVERB_PORT,
        wssPort: REVERB_PORT,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
    });
};