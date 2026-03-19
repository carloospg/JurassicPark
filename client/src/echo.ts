import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as any).Pusher = Pusher;

const echo = new Echo({
    broadcaster:       'reverb',
    key:               'dk1kw8wzg4whrv3inuv5',
    wsHost:            'localhost',
    wsPort:            8080,
    wssPort:           8080,
    forceTLS:          false,
    enabledTransports: ['ws', 'wss'],
    disableStats:      true,
});

export default echo;