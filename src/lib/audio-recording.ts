import { VAD } from "./vad";

///======================= VAD
let isListening = null;
let blobs: Blob[] = [];
let mediaRecorder: MediaRecorder | null = null;
export function startAudioRecordingfn(callback: (chunks: any) => void) {
    

    isListening = true;

    function startRecording(stream) {
        try {
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    blobs.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const finalBuffer: Buffer[] = [];
                for (let blob of blobs) {
                    const buffer = await blob.arrayBuffer();
                    finalBuffer.push(Buffer.from(buffer));
                }
                const merged = Buffer.concat(finalBuffer);
                callback(merged);
                blobs = [];
            };

            mediaRecorder.start();
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    }

    // Stop recording and release microphone access
    function stopRecording() {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    }

    function startUserMedia(stream) {
        window.AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        var audioContext = new AudioContext();
        var source = audioContext.createMediaStreamSource(stream);
        startRecording(stream);
        // Setup options
        var options = {
            source: source,
            voice_stop: function () { console.log('voice_stop'); stopRecording(); },
            // voice_start: function () { console.log('voice_start'); startRecording(stream); },
        };

        new VAD({
            energy_threshold_ratio_pos: 2,
            energy_threshold_ratio_neg: 0.9, // sensitivity for stop
            energy_integration: 1,
            filter: [{ f: 100000, v: 1 }],
            ...options,
        });
    }

    (navigator as any).getUserMedia = (navigator as any).getUserMedia ||
        (navigator as any).mozGetUserMedia ||
        (navigator as any).webkitGetUserMedia;
    (navigator as any).getUserMedia({ audio: true }, startUserMedia, function (e) {
        console.log("No live audio input in this browser: " + e);
    });
}

export function stopAudioRecordingFn() {
    isListening = false;
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    mediaRecorder = undefined;
}
