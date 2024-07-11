export class VAD {
    private options: {
        fftSize: number;
        bufferLen: number;
        voice_stop: () => void;
        voice_start: () => void;
        smoothingTimeConstant: number;
        energy_offset: number;
        energy_threshold_ratio_pos: number;
        energy_threshold_ratio_neg: number;
        energy_integration: number;
        filter: { f: number; v: number }[];
        source: MediaStreamAudioSourceNode | null;
        context: AudioContext | null;
    };

    private hertzPerBin: number;
    private iterationFrequency: number;
    private iterationPeriod: number;

    private filter: any[];
    private ready: { energy?: boolean };
    private vadState: boolean;

    private energy: number;
    private energy_offset: number;
    private energy_threshold_pos: number;
    private energy_threshold_neg: number;
    private voiceTrend: number;
    private voiceTrendMax: number;
    private voiceTrendMin: number;
    private voiceTrendStart: number;
    private voiceTrendEnd: number;

    private analyser: AnalyserNode;
    private floatFrequencyData: Float32Array;
    private floatFrequencyDataLinear: Float32Array;

    private scriptProcessorNode: ScriptProcessorNode;
    private logging: boolean;
    private log_i: number;
    private log_limit: number;

    constructor(options?: {
        fftSize?: number;
        bufferLen?: number;
        voice_stop?: () => void;
        voice_start?: () => void;
        smoothingTimeConstant?: number;
        energy_offset?: number;
        energy_threshold_ratio_pos?: number;
        energy_threshold_ratio_neg?: number;
        energy_integration?: number;
        filter?: { f: number; v: number }[];
        source: MediaStreamAudioSourceNode;
        context?: AudioContext;
    }) {
        // Default options
        this.options = {
            fftSize: 512,
            bufferLen: 512,
            voice_stop: () => { },
            voice_start: () => { },
            smoothingTimeConstant: 0.99,
            energy_offset: 1e-8,
            energy_threshold_ratio_pos: 2,
            energy_threshold_ratio_neg: 0.5,
            energy_integration: 1,
            filter: [
                { f: 200, v: 0 },
                { f: 2000, v: 1 },
            ],
            source: null,
            context: null,
            ...options,
        };

        // Require source
        if (!this.options.source)
            throw new Error("The options must specify a MediaStreamAudioSourceNode.");

        // Set this.options.context
        this.options.context = this.options.source.context as any;

        // Calculate time relationships
        this.hertzPerBin = this.options.context.sampleRate / this.options.fftSize;
        this.iterationFrequency = this.options.context.sampleRate / this.options.bufferLen;
        this.iterationPeriod = 1 / this.iterationFrequency;

        // Set the filter
        this.setFilter(this.options.filter);

        this.ready = {};
        this.vadState = false;

        // Energy detector props
        this.energy_offset = this.options.energy_offset;
        this.energy_threshold_pos = this.energy_offset * this.options.energy_threshold_ratio_pos;
        this.energy_threshold_neg = this.energy_offset * this.options.energy_threshold_ratio_neg;
        this.voiceTrend = 0;
        this.voiceTrendMax = 10;
        this.voiceTrendMin = -10;
        this.voiceTrendStart = 5;
        this.voiceTrendEnd = -5;

        // Create analyser
        this.analyser = this.options.context.createAnalyser();
        this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;
        this.analyser.fftSize = this.options.fftSize;

        this.floatFrequencyData = new Float32Array(this.analyser.frequencyBinCount);

        // Setup local storage of the Linear FFT data
        this.floatFrequencyDataLinear = new Float32Array(this.floatFrequencyData.length);

        // Connect this.analyser
        this.options.source.connect(this.analyser);

        // Create ScriptProcessorNode
        this.scriptProcessorNode = this.options.context.createScriptProcessor(this.options.bufferLen, 1, 1);

        // Connect scriptProcessorNode (Theoretically, not required)
        this.scriptProcessorNode.connect(this.options.context.destination);

        // Create callback to update/analyze floatFrequencyData
        this.scriptProcessorNode.onaudioprocess = (event) => {
            this.analyser.getFloatFrequencyData(this.floatFrequencyData);
            this.update();
            this.monitor();
        };

        // Connect scriptProcessorNode
        this.options.source.connect(this.scriptProcessorNode);

        // log stuff
        this.logging = false;
        this.log_i = 0;
        this.log_limit = 100;
    }

    private setFilter(shape: { f: number; v: number }[]) {
        this.filter = [];
        for (let i = 0, iLen = this.options.fftSize / 2; i < iLen; i++) {
            this.filter[i] = 0;
            for (let j = 0, jLen = shape.length; j < jLen; j++) {
                if (i * this.hertzPerBin < shape[j].f) {
                    this.filter[i] = shape[j].v;
                    break;
                }
            }
        }
    }

    private update() {
        // Update the local version of the Linear FFT
        const fft = this.floatFrequencyData;
        for (let i = 0, iLen = fft.length; i < iLen; i++) {
            this.floatFrequencyDataLinear[i] = Math.pow(10, fft[i] / 10);
        }
        this.ready = {};
    }

    private getEnergy() {
        if (this.ready.energy) {
            return this.energy;
        }

        let energy = 0;
        const fft = this.floatFrequencyDataLinear;

        for (let i = 0, iLen = fft.length; i < iLen; i++) {
            energy += this.filter[i] * fft[i] * fft[i];
        }

        this.energy = energy;
        this.ready.energy = true;

        return energy;
    }

    private monitor() {
        const energy = this.getEnergy();
        const signal = energy - this.energy_offset;

        if (signal > this.energy_threshold_pos) {
            this.voiceTrend = this.voiceTrend + 1 > this.voiceTrendMax ? this.voiceTrendMax : this.voiceTrend + 1;
        } else if (signal < -this.energy_threshold_neg) {
            this.voiceTrend = this.voiceTrend - 1 < this.voiceTrendMin ? this.voiceTrendMin : this.voiceTrend - 1;
        } else {
            if (this.voiceTrend > 0) {
                this.voiceTrend--;
            } else if (this.voiceTrend < 0) {
                this.voiceTrend++;
            }
        }

        let start = false,
            end = false;
        if (this.voiceTrend > this.voiceTrendStart) {
            start = true;
        } else if (this.voiceTrend < this.voiceTrendEnd) {
            end = true;
        }

        const integration = signal * this.iterationPeriod * this.options.energy_integration;

        if (integration > 0 || !end) {
            this.energy_offset += integration;
        } else {
            this.energy_offset += integration * 10;
        }
        this.energy_offset = this.energy_offset < 0 ? 0 : this.energy_offset;
        this.energy_threshold_pos = this.energy_offset * this.options.energy_threshold_ratio_pos;
        this.energy_threshold_neg = this.energy_offset * this.options.energy_threshold_ratio_neg;

        if (start && !this.vadState) {
            this.vadState = true;
            this.options.voice_start();
        }
        if (end && this.vadState) {
            this.vadState = false;
            this.options.voice_stop();
        }

        this.log(
            'e: ' +
            energy +
            ' | e_of: ' +
            this.energy_offset +
            ' | e+_th: ' +
            this.energy_threshold_pos +
            ' | e-_th: ' +
            this.energy_threshold_neg +
            ' | signal: ' +
            signal +
            ' | int: ' +
            integration +
            ' | voiceTrend: ' +
            this.voiceTrend +
            ' | start: ' +
            start +
            ' | end: ' +
            end
        );

        return signal;
    }

    private log(msg: string) {
        if (this.logging && this.log_i < this.log_limit) {
            this.log_i++;
            console.log(msg);
        } else {
            this.logging = false;
        }
    }

    triggerLog(limit?: number) {
        this.logging = true;
        this.log_i = 0;
        this.log_limit = typeof limit === 'number' ? limit : this.log_limit;
    }
}

  // Usage example:
  // const vad = new VAD({ source: yourAudioSourceNode });
