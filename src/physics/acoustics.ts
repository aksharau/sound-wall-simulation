import { Material, PhysicsResults } from '../types';

export const MATERIAL_PRESETS: Material[] = [
  {
    id: 'concrete',
    name: 'Dense Concrete',
    category: 'Heavy Masonry',
    density: 2300, // kg/m^3
    soundSpeed: 3400, // m/s
    damping: 1.8, // dB/m
    color: '#64748b',
    borderColor: '#94a3b8',
    patternStyle: 'concrete',
    description: 'High density and massive acoustic impedance. Excellent acoustic isolation across most audio frequencies.',
  },
  {
    id: 'brick',
    name: 'Solid Red Brick',
    category: 'Masonry',
    density: 1800,
    soundSpeed: 2800,
    damping: 2.5,
    color: '#b45309',
    borderColor: '#d97706',
    patternStyle: 'brick',
    description: 'Standard architectural brick wall with significant mass law attenuation and structural damping.',
  },
  {
    id: 'drywall',
    name: 'Gypsum Board / Drywall',
    category: 'Lightweight Partition',
    density: 800,
    soundSpeed: 1500,
    damping: 6.0,
    color: '#78716c',
    borderColor: '#a8a29e',
    patternStyle: 'drywall',
    description: 'Common interior partition. Moderate impedance allowing low frequencies (bass) to leak through easily.',
  },
  {
    id: 'glass',
    name: 'Architectural Glass',
    category: 'Glazing',
    density: 2500,
    soundSpeed: 4000,
    damping: 0.8,
    color: '#0284c7',
    borderColor: '#38bdf8',
    patternStyle: 'glass',
    description: 'High sound speed and stiffness with low internal loss, creating distinct resonance transmission peaks.',
  },
  {
    id: 'wood',
    name: 'Plywood / Hardwood',
    category: 'Timber',
    density: 650,
    soundSpeed: 3300,
    damping: 8.0,
    color: '#9a3412',
    borderColor: '#c2410c',
    patternStyle: 'wood',
    description: 'Natural organic acoustic damping with lower mass; common in residential floors and stud walls.',
  },
  {
    id: 'foam',
    name: 'Acoustic Open-Cell Foam',
    category: 'Porous Absorber',
    density: 45,
    soundSpeed: 310,
    damping: 45.0, // strong damping
    color: '#475569',
    borderColor: '#64748b',
    patternStyle: 'foam',
    description: 'Porous dissipative material. Matches air impedance closely but dissipates energy into heat via viscous friction.',
  },
  {
    id: 'steel',
    name: 'Steel Barrier Plate',
    category: 'Metal',
    density: 7850,
    soundSpeed: 5100,
    damping: 0.2,
    color: '#4f46e5',
    borderColor: '#818cf8',
    patternStyle: 'metal',
    description: 'Immense acoustic impedance (Z > 40,000,000 Rayls). Reflects nearly 99.99% of incident sound energy.',
  },
  {
    id: 'custom',
    name: 'Custom Tunable Material',
    category: 'Experimental',
    density: 1200,
    soundSpeed: 2000,
    damping: 3.0,
    color: '#0d9488',
    borderColor: '#2dd4bf',
    patternStyle: 'custom',
    description: 'Fully customizable density, sound speed, and internal damping for arbitrary acoustic experiments.',
  },
];

export interface WaveFieldResult {
  x: number;
  incident: number;
  reflected: number;
  transmitted: number;
  wallInternal: number;
  totalPressure: number;
  envelope: number;
  particleDisplacement: number;
}

/**
 * Calculates physical acoustic coefficients and metrics for the given setup.
 */
export function calculatePhysics(
  frequency: number,
  wallThickness: number,
  material: Material,
  cAir: number = 343,
  rhoAir: number = 1.204
): PhysicsResults {
  const f = Math.max(1, frequency);
  const d = Math.max(0.001, wallThickness);

  // Wavelengths
  const lambdaAir = cAir / f;
  const lambdaWall = material.soundSpeed / f;

  // Specific Acoustic Impedances (Rayls = Pa*s/m)
  const zAir = rhoAir * cAir;
  const zWall = material.density * material.soundSpeed;
  const r = zWall / zAir; // Impedance ratio

  // Wave numbers
  const kWall = (2 * Math.PI * f) / material.soundSpeed;
  const phi = kWall * d; // Phase thickness in radians

  // Material attenuation damping alpha (Np/m) from dB/m:
  // alpha_Np = dB_per_meter / (20 * log10(e)) = dB_per_meter / 8.6858896
  const alphaNp = material.damping / 8.6858896;
  const dampingLossFactor = Math.exp(-alphaNp * d); // Amplitude attenuation
  const attenuationLossDB = material.damping * d;

  // Exact slab transmission and reflection (lossless base)
  // tau_lossless = 1 / [ 1 + 0.25 * (r - 1/r)^2 * sin^2(k_wall * d) ]
  const impedanceMismatchFactor = 0.25 * Math.pow(r - 1 / r, 2);
  const sinPhi = Math.sin(phi);
  const sin2Phi = sinPhi * sinPhi;
  const denom = 1 + impedanceMismatchFactor * sin2Phi;

  const powerTransLossless = 1 / denom;
  const powerReflectLossless = 1 - powerTransLossless;

  // Including damping in wall transmission
  const powerTransCoeff = Math.min(1, Math.max(0, powerTransLossless * Math.pow(dampingLossFactor, 2)));
  const powerReflectCoeff = Math.min(1, Math.max(0, powerReflectLossless));
  
  const pressureTransCoeff = Math.sqrt(powerTransCoeff);
  const pressureReflectCoeff = Math.sqrt(powerReflectCoeff);

  // Sound Transmission Loss (STL) in dB = 10 * log10(1 / tau)
  let transmissionLossDB = 0;
  if (powerTransCoeff > 1e-12) {
    transmissionLossDB = 10 * Math.log10(1 / powerTransCoeff);
  } else {
    transmissionLossDB = 120; // Cap
  }

  const totalLossDB = transmissionLossDB;

  // Mass law estimate for comparison: TL ~ 20*log10(m*f) - 47 dB (normal incidence)
  const arealMass = material.density * d; // kg/m^2
  const massLawTL_DB = Math.max(0, 20 * Math.log10(Math.max(1, arealMass * f)) - 42.4);

  // Standing Wave Ratio (SWR) on incident side: SWR = (1 + |R|) / (1 - |R|)
  const absR = Math.min(0.999, pressureReflectCoeff);
  const standingWaveRatio = (1 + absR) / Math.max(0.001, 1 - absR);

  // Resonance conditions
  const thicknessInWavelengths = d / lambdaWall;
  // Half-wave resonance occurs when d is near n * lambda_wall / 2
  const nearestHalfWaveOrder = Math.round(thicknessInWavelengths * 2);
  const halfWaveError = Math.abs(thicknessInWavelengths * 2 - nearestHalfWaveOrder);
  const isHalfWaveResonance = halfWaveError < 0.08 && nearestHalfWaveOrder > 0;

  // Quarter-wave max reflection occurs when d is near (2n+1) * lambda_wall / 4
  const quarterWavePhaseMod = (thicknessInWavelengths * 4) % 2;
  const isQuarterWaveMaxReflection = Math.abs(quarterWavePhaseMod - 1) < 0.12;

  return {
    wavelengthAir: lambdaAir,
    wavelengthWall: lambdaWall,
    zAir,
    zWall,
    impedanceRatio: r,
    pressureReflectCoeff,
    powerReflectCoeff,
    pressureTransCoeff,
    powerTransCoeff,
    transmissionLossDB,
    attenuationLossDB,
    totalLossDB,
    standingWaveRatio,
    phaseThicknessRad: phi,
    thicknessInWavelengths,
    isHalfWaveResonance,
    isQuarterWaveMaxReflection,
    massLawTL_DB,
  };
}

/**
 * Converts Sound Pressure Level (dB SPL referenced to 20 uPa) to RMS acoustic pressure in Pascals.
 */
export function splToPressurePa(splDB: number): number {
  const p0 = 20e-6; // 20 micropascals reference
  return p0 * Math.pow(10, splDB / 20);
}

/**
 * Converts RMS acoustic pressure in Pascals to Sound Pressure Level (dB SPL).
 */
export function pressurePaToSPL(pressurePa: number): number {
  const p0 = 20e-6;
  if (pressurePa <= 0) return 0;
  return Math.max(0, 20 * Math.log10(pressurePa / p0));
}

/**
 * Generates an array of transmission loss vs frequency data points for plotting frequency response.
 */
export function generateFrequencyResponseCurve(
  wallThickness: number,
  material: Material,
  cAir: number = 343,
  rhoAir: number = 1.204
): Array<{ frequency: number; transmissionLossDB: number; transmissionPct: number; massLawDB: number }> {
  const points: Array<{ frequency: number; transmissionLossDB: number; transmissionPct: number; massLawDB: number }> = [];
  
  // Frequencies from 20 Hz to 5000 Hz in logarithmic-like distribution
  const fMin = 20;
  const fMax = 5000;
  const steps = 120;
  
  for (let i = 0; i <= steps; i++) {
    const logF = Math.log10(fMin) + (i / steps) * (Math.log10(fMax) - Math.log10(fMin));
    const freq = Math.round(Math.pow(10, logF));
    const phys = calculatePhysics(freq, wallThickness, material, cAir, rhoAir);
    points.push({
      frequency: freq,
      transmissionLossDB: Number(phys.totalLossDB.toFixed(1)),
      transmissionPct: Number((phys.powerTransCoeff * 100).toFixed(2)),
      massLawDB: Number(phys.massLawTL_DB.toFixed(1)),
    });
  }

  return points;
}

/**
 * Generates transmission vs wall thickness data points.
 */
export function generateThicknessResponseCurve(
  frequency: number,
  material: Material,
  cAir: number = 343,
  rhoAir: number = 1.204
): Array<{ thicknessCm: number; transmissionLossDB: number; transmissionPct: number }> {
  const points: Array<{ thicknessCm: number; transmissionLossDB: number; transmissionPct: number }> = [];
  const steps = 100;
  const maxThicknessMeters = 0.8; // 80 cm

  for (let i = 1; i <= steps; i++) {
    const d = (i / steps) * maxThicknessMeters;
    const phys = calculatePhysics(frequency, d, material, cAir, rhoAir);
    points.push({
      thicknessCm: Number((d * 100).toFixed(1)),
      transmissionLossDB: Number(phys.totalLossDB.toFixed(1)),
      transmissionPct: Number((phys.powerTransCoeff * 100).toFixed(2)),
    });
  }

  return points;
}

/**
 * Calculates continuous wave pressure at a specific spatial coordinate x and time t.
 * Space: [0, L]
 * Wall: [wallStartX, wallEndX], thickness d = wallEndX - wallStartX
 */
export function sampleWaveAtPoint(
  x: number, // in meters
  t: number, // time in seconds
  totalLength: number,
  wallStartX: number,
  wallEndX: number,
  frequency: number,
  amplitude: number,
  material: Material,
  cAir: number = 343,
  rhoAir: number = 1.204
): WaveFieldResult {
  const d = wallEndX - wallStartX;
  const phys = calculatePhysics(frequency, d, material, cAir, rhoAir);
  const omega = 2 * Math.PI * frequency;
  const k1 = omega / cAir;
  const k2 = omega / material.soundSpeed;
  const alphaNp = material.damping / 8.6858896;

  // Complex reflection and transmission phase shifts
  // r_complex = i*(r^2 - 1)*sin(phi) / [ 2*r*cos(phi) + i*(r^2 + 1)*sin(phi) ]
  const rRatio = phys.impedanceRatio;
  const phi = phys.phaseThicknessRad;
  const reD = 2 * rRatio * Math.cos(phi);
  const imD = (rRatio * rRatio + 1) * Math.sin(phi);
  const denMag2 = reD * reD + imD * imD;

  const numImR = (rRatio * rRatio - 1) * Math.sin(phi);
  // r_complex = (i * numImR) / (reD + i * imD) = (numImR * imD + i * numImR * reD) / denMag2
  const reR = (numImR * imD) / denMag2;
  const imR = (numImR * reD) / denMag2;
  const phaseR = Math.atan2(imR, reR);

  // Transmission complex: 2*r / (reD + i * imD) = (2*r*reD - i*2*r*imD) / denMag2
  const phaseT = Math.atan2(-2 * rRatio * imD, 2 * rRatio * reD);

  let incident = 0;
  let reflected = 0;
  let transmitted = 0;
  let wallInternal = 0;
  let totalPressure = 0;
  let envelope = 0;
  let particleDisplacement = 0;

  if (x < wallStartX) {
    // Air region before wall (Incident side)
    const distToWall = wallStartX - x;
    const phaseIncident = k1 * (x - wallStartX) - omega * t;
    const phaseReflected = -k1 * (x - wallStartX) - omega * t + phaseR;

    incident = amplitude * Math.cos(phaseIncident);
    reflected = phys.pressureReflectCoeff * amplitude * Math.cos(phaseReflected);
    totalPressure = incident + reflected;
    
    // Standing wave envelope: sqrt( (1 + |R|)^2 cos^2 + (1 - |R|)^2 sin^2 )
    const R_amp = phys.pressureReflectCoeff;
    envelope = amplitude * Math.sqrt(1 + R_amp * R_amp + 2 * R_amp * Math.cos(2 * k1 * distToWall + phaseR));

    // Particle velocity/displacement is proportional to pressure gradient:
    // s_inc ~ cos(phase - pi/2) = sin(phase), s_ref ~ -sin(phase_ref)
    particleDisplacement = (incident - reflected) * 0.8;
  } else if (x <= wallEndX) {
    // Inside the Wall
    const xInWall = x - wallStartX;
    const fractionThroughWall = xInWall / d;
    const internalDamping = Math.exp(-alphaNp * xInWall);
    
    // Internal wave with forward & backward bouncing inside slab
    const forwardWave = amplitude * (2 / (rRatio + 1)) * internalDamping * Math.cos(k2 * xInWall - omega * t);
    const backwardWave = amplitude * (2 / (rRatio + 1)) * phys.pressureReflectCoeff * Math.exp(-alphaNp * (d - xInWall)) * Math.cos(-k2 * xInWall - omega * t + phaseR);
    
    wallInternal = forwardWave + backwardWave;
    // Scale wall internal pressure visually by impedance to show solid stress / pressure
    totalPressure = wallInternal;
    envelope = amplitude * (1 - fractionThroughWall * 0.5);
    // Wall particles are stiffer, smaller displacement
    particleDisplacement = (wallInternal / Math.max(2, rRatio * 0.3)) * 0.3;
  } else {
    // Air region after wall (Transmitted side)
    const distPastWall = x - wallEndX;
    const phaseTrans = k1 * distPastWall - omega * t + phaseT;
    const ampTrans = amplitude * phys.pressureTransCoeff;

    transmitted = ampTrans * Math.cos(phaseTrans);
    totalPressure = transmitted;
    envelope = ampTrans;
    particleDisplacement = transmitted * 0.8;
  }

  return {
    x,
    incident,
    reflected,
    transmitted,
    wallInternal,
    totalPressure,
    envelope,
    particleDisplacement,
  };
}
