import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface SplashScreenProps {
    onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [fading, setFading] = useState(false);
    const [videoReady, setVideoReady] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const finish = () => {
            setFading(true);
            setTimeout(onFinish, 500);
        };

        const onCanPlay = () => {
            setVideoReady(true);
            // On native (iOS/Android), hide the native splash screen
            if (Capacitor.isNativePlatform()) {
                import('@capacitor/splash-screen').then(({ SplashScreen }) => {
                    SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
                }).catch(() => {});
            }
            video.play().catch(() => finish());
        };

        video.addEventListener('ended', finish);
        video.addEventListener('canplay', onCanPlay);

        const fallback = setTimeout(finish, 8000);
        video.load();

        return () => {
            video.removeEventListener('ended', finish);
            video.removeEventListener('canplay', onCanPlay);
            clearTimeout(fallback);
        };
    }, [onFinish]);

    return (
        <div
            className="fixed inset-0 z-[9999] bg-white transition-opacity duration-500"
            style={{ opacity: fading ? 0 : 1 }}
        >
            <video
                ref={videoRef}
                src="/splash.mp4"
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-contain"
                style={{ opacity: videoReady ? 1 : 0, transition: 'opacity 0.2s' }}
            />
        </div>
    );
}
