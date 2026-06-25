'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';
import Button from './Button';

interface WebcamCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      
      setStream(mediaStream);
      setError('');
      
      // Wait for next tick to ensure video element is ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => {
            console.error('Video play error:', err);
            setError('Failed to start video playback');
          });
        }
      }, 100);
    } catch (err) {
      setError('Failed to access camera. Please allow camera permission.');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'face-photo.jpg', { type: 'image/jpeg' });
          onCapture(file);
          stopCamera();
          onClose();
        });
    }
  }, [capturedImage, onCapture, onClose, stopCamera]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background-card rounded-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Capture Face Photo</h3>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 hover:bg-background-light rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <p className="text-error mb-4">{error}</p>
              <Button onClick={startCamera} variant="outline">
                Try Again
              </Button>
            </div>
          ) : !stream && !capturedImage ? (
            <div className="text-center py-8">
              <Camera className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
              <p className="text-foreground-muted mb-4">Click below to start camera</p>
              <Button onClick={startCamera} leftIcon={<Camera className="w-4 h-4" />}>
                Start Camera
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {capturedImage ? (
                <div className="relative aspect-[4/3] bg-background rounded-lg overflow-hidden">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      video.play().catch(err => console.error('Play error:', err));
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-lg m-8 pointer-events-none" />
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-3">
                {capturedImage ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={retake}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                    >
                      Retake
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={confirmCapture}
                      leftIcon={<Camera className="w-4 h-4" />}
                    >
                      Confirm
                    </Button>
                  </>
                ) : (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={capturePhoto}
                    leftIcon={<Camera className="w-4 h-4" />}
                  >
                    Capture Photo
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
