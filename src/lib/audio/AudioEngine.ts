class WebAudioEngine {
  ctx: AudioContext | null = null;
  droneOsc: OscillatorNode | null = null;
  droneGain: GainNode | null = null;
  muted: boolean = true;
  initialized: boolean = false;
  whaleTimer: NodeJS.Timeout | null = null;

  init() {
    if (this.initialized) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    this.ctx = new AudioContextClass();
    
    // Setup Drone
    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.value = 55;
    
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0; // starts muted
    
    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.ctx.destination);
    
    this.droneOsc.start();
    this.initialized = true;

    this.scheduleWhaleCall();
  }

  toggleMute() {
    if (!this.initialized) this.init();
    this.muted = !this.muted;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setTargetAtTime(this.muted ? 0 : 0.04, this.ctx.currentTime, 0.5);
    }
  }

  playBubble() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  scheduleWhaleCall() {
    if (!this.ctx) return;
    const nextCall = Math.random() * 45000 + 45000; // 45-90s
    this.whaleTimer = setTimeout(() => {
      this.playWhaleCall();
      this.scheduleWhaleCall();
    }, nextCall);
  }

  playWhaleCall() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 2);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 4);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 1);
    gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 3);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 4);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 4);
  }
}

export const audioEngine = typeof window !== 'undefined' ? new WebAudioEngine() : null;
