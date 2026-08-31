# Sound Wave Wall Simulator

An interactive acoustics physics simulator built with React, TypeScript, Tailwind CSS, and Web Audio API. It models sound wave reflection, transmission, and attenuation through barriers of varying thicknesses and materials (such as concrete, brick, drywall, wood, glass, foam, and custom configurations).

## Features

- **Multi-Modal Visualizations**:
  - **Air Molecules (Compression Grid)**: Longitudinal particle displacement showing real-time acoustic compressions and rarefactions.
  - **Pressure Waveform (1D)**: Continuous wave profiles displaying incident, reflected, internal, and transmitted wave superposition.
  - **Pressure Field (2D)**: Wavefront phase mapping across spatial domains.
  - **Wave Packet (Pulse Transit)**: Time-domain pulse propagation demonstrating boundary reflection and delayed transmission.
- **Physical Controls**:
  - Sound Frequency ($20\text{ Hz} - 4000\text{ Hz}$) and Wavelength coupling.
  - Variable Wall Thickness ($0.5\text{ cm} - 60\text{ cm}$) with half-wave resonance indicators ($d \approx n\lambda_{\text{wall}}/2$).
  - Realistic Material Library: Concrete, Brick, Drywall, Wood, Glass, Acoustic Foam, and fully customizable parameters.
- **Interactive Probe & Oscilloscope**:
  - Draggable microphone probe measuring local pressure amplitude, phase, and decibel level.
  - Real-time oscilloscope canvas plotting $P(t)$.
- **Audio Synthesizer (Web Audio API)**:
  - Real-time audible tone generation corresponding to source, transmitted, or probed sound pressure levels.
  - Audio pulse chirp demonstration.
- **Acoustical Analysis**:
  - Live charts for Sound Transmission Loss (STL in dB) across the audible frequency spectrum.
  - Power Transmission vs. Wall Thickness response curve.
  - Mass Law approximations and standing wave ratio (SWR) calculations.

## Tech Stack

- **Framework**: React 18+ with Vite & TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts & D3
- **Icons**: Lucide React
- **Audio**: Web Audio API (OscillatorNode, GainNode, StereoPannerNode)

## Prerequisites

- **Node.js**: Version `18.0.0` or higher (`20.x` or `22.x` LTS recommended). Vite 6 requires Node.js >= 18.

## Getting Started

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Build

```bash
npm run build
```
