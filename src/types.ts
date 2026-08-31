export type VisualizationMode = 'particles' | 'waveform' | 'heatmap' | 'pulse';

export type WaveSourceType = 'continuous' | 'pulse';

export interface Material {
  id: string;
  name: string;
  category: string;
  density: number; // kg/m^3
  soundSpeed: number; // m/s
  damping: number; // dB/m (or attenuation alpha)
  color: string;
  borderColor: string;
  patternStyle: 'concrete' | 'brick' | 'drywall' | 'glass' | 'wood' | 'foam' | 'metal' | 'custom';
  description: string;
}

export interface AcousticSimulationParams {
  frequency: number; // Hz (e.g. 50 to 5000 Hz)
  wallThickness: number; // meters (e.g. 0.02 to 0.60 m)
  amplitude: number; // arbitrary units 0.1 to 1.0
  material: Material;
  cAir: number; // speed of sound in air (m/s, default 343)
  rhoAir: number; // air density (kg/m^3, default 1.204)
  simulationSpeed: number; // multiplier (e.g. 0.2x to 2.0x)
  isPaused: boolean;
  sourceType: WaveSourceType;
  pulseWidth: number; // pulse standard deviation in meters
  showIncidentWave: boolean;
  showReflectedWave: boolean;
  showTransmittedWave: boolean;
  showSuperposition: boolean;
  showEnvelope: boolean;
  showParticlesGrid: boolean;
  probePosition: number; // normalized 0.0 to 1.0 across space
  isAudioMuted: boolean;
  audioVolume: number;
  audioListeningMode: 'source' | 'transmitted' | 'probe';
}

export interface PhysicsResults {
  wavelengthAir: number; // meters
  wavelengthWall: number; // meters
  zAir: number; // Acoustic impedance of air (Rayls = Pa*s/m)
  zWall: number; // Acoustic impedance of wall (Rayls)
  impedanceRatio: number; // Z_wall / Z_air
  pressureReflectCoeff: number; // Real amplitude R (-1 to 1)
  powerReflectCoeff: number; // R^2 (0 to 1)
  pressureTransCoeff: number; // Amplitude T (0 to 1)
  powerTransCoeff: number; // tau (0 to 1)
  transmissionLossDB: number; // Sound Transmission Loss in dB
  attenuationLossDB: number; // Damping loss inside wall in dB
  totalLossDB: number; // Total transmission loss including damping
  standingWaveRatio: number; // SWR on incident side
  phaseThicknessRad: number; // k_wall * d (radians)
  thicknessInWavelengths: number; // d / lambda_wall
  isHalfWaveResonance: boolean; // d near n * lambda_wall / 2
  isQuarterWaveMaxReflection: boolean; // d near (2n+1) * lambda_wall / 4
  massLawTL_DB: number; // Theoretical mass law estimate in dB
}

export interface ProbeMeasurement {
  xNormalized: number;
  xMeters: number;
  region: 'air-incident' | 'wall' | 'air-transmitted';
  instantPressure: number;
  rmsPressure: number;
  splDB: number;
}
