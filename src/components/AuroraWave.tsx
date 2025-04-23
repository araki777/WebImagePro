import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh, ShaderMaterial } from "three";

const vertexShader = `
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;

  //
  // Description : Array and textureless GLSL 2D/3D/4D simplex
  //               noise functions.
  //      Author : Ian McEwan, Ashima Arts.
  //  Maintainer : stegu
  //     Lastmod : 20110822 (ijm)
  //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
  //               Distributed under the MIT License. See LICENSE file.
  //               https://github.com/ashima/webgl-noise
  //               https://github.com/stegu/webgl-noise
  //

  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec3 permute(vec3 x) {
    return mod289(((x*34.0)+1.0)*x);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vUv = uv;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Create multiple layers of noise with different frequencies and speeds
    float noise1 = snoise(vec2(modelPosition.x * 0.3 + uTime * 0.15, modelPosition.z * 0.3 + uTime * 0.1));
    float noise2 = snoise(vec2(modelPosition.x * 0.15 - uTime * 0.1, modelPosition.z * 0.15 + uTime * 0.05));
    float noise3 = snoise(vec2(modelPosition.x * 0.45 + uTime * 0.05, modelPosition.z * 0.45 - uTime * 0.075));
    float noise4 = snoise(vec2(modelPosition.x * 0.6 - uTime * 0.2, modelPosition.z * 0.6 + uTime * 0.15));

    // Combine noise layers with different weights
    float elevation = noise1 * 0.4 + noise2 * 0.3 + noise3 * 0.2 + noise4 * 0.1;
    elevation *= 1.5; // Amplify the effect

    modelPosition.y += elevation;
    vElevation = elevation;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying float vElevation;
  varying vec2 vUv;

  void main() {
    // Create a more dynamic alpha based on elevation and UV position
    float alpha = smoothstep(-1.0, 1.0, vElevation) * 0.7;
    alpha *= smoothstep(0.0, 0.3, 1.0 - distance(vUv, vec2(0.5)));

    // Enhanced color blending
    float t1 = (vElevation + 1.0) * 0.5; // Normalize elevation to 0-1
    float t2 = sin(vUv.x * 6.28 + vElevation * 2.0) * 0.5 + 0.5;

    // Create primary color mix
    vec3 color1 = mix(uColorA, uColorB, t1);
    vec3 color2 = mix(uColorB, uColorC, t2);

    // Add time-based color variation
    float colorMix = smoothstep(-0.2, 0.2, sin(vUv.y * 3.14 + vElevation * 3.0));
    vec3 finalColor = mix(color1, color2, colorMix);

    // Add ethereal glow
    float glow = pow(1.0 - distance(vUv, vec2(0.5)), 3.0) * 0.8;
    finalColor += vec3(0.3, 0.5, 0.7) * glow;

    // Enhance color vibrancy
    finalColor *= 1.2;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export function AuroraWave() {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime() * 0.3; // Slower animation
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, -2]}>
      <planeGeometry args={[30, 30, 128, 128]} /> {/* Increased resolution */}
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uColorA: { value: [0.1, 0.2, 0.8] }, // Deep blue
          uColorB: { value: [0.15, 0.7, 0.6] }, // Cyan
          uColorC: { value: [0.2, 0.9, 0.5] }, // Bright green
        }}
        transparent={true}
      />
    </mesh>
  );
}
