
import React, { useEffect, useRef } from 'react';
import { cn } from "../../lib/utils";

interface ShaderBackgroundProps {
    className?: string;
}

const ShaderBackground: React.FC<ShaderBackgroundProps> = ({ className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Vertex shader source code
    const vsSource = `
    attribute vec4 aVertexPosition;
    void main() {
      gl_Position = aVertexPosition;
    }
  `;

    // Fragment shader source code - Modified for Dark Coffee on Light Background
    const fsSource = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;

    const float overallSpeed = 0.2;
    const float gridSmoothWidth = 0.015;
    const float axisWidth = 0.05;
    const float majorLineWidth = 0.025;
    const float minorLineWidth = 0.0125;
    const float majorLineFrequency = 5.0;
    const float minorLineFrequency = 1.0;
    const float scale = 5.0;
    
    // COFFEE THEME COLORS
    // Dark Espresso Lines (Dark Coffee)
    const vec4 lineColor = vec4(0.173, 0.129, 0.114, 1.0); 
    
    const float minLineWidth = 0.01;
    const float maxLineWidth = 0.2;
    const float lineSpeed = 1.0 * overallSpeed;
    const float lineAmplitude = 1.0;
    const float lineFrequency = 0.2;
    const float warpSpeed = 0.2 * overallSpeed;
    const float warpFrequency = 0.5;
    const float warpAmplitude = 1.0;
    const float offsetFrequency = 0.5;
    const float offsetSpeed = 1.33 * overallSpeed;
    const float minOffsetSpread = 0.6;
    const float maxOffsetSpread = 2.0;
    const int linesPerGroup = 16;

    #define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
    #define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))
    #define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))
    #define drawPeriodicLine(freq, width, t) drawCrispLine(freq / 2.0, width, abs(mod(t, freq) - (freq) / 2.0))

    float drawGridLines(float axis) {
      return drawCrispLine(0.0, axisWidth, axis)
            + drawPeriodicLine(majorLineFrequency, majorLineWidth, axis)
            + drawPeriodicLine(minorLineFrequency, minorLineWidth, axis);
    }

    float drawGrid(vec2 space) {
      return min(1.0, drawGridLines(space.x) + drawGridLines(space.y));
    }

    float random(float t) {
      return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
    }

    float getPlasmaY(float x, float horizontalFade, float offset) {
      return random(x * lineFrequency + iTime * lineSpeed) * horizontalFade * lineAmplitude + offset;
    }

    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec2 uv = fragCoord.xy / iResolution.xy;
      vec2 space = (fragCoord - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;

      float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
      float verticalFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

      space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + horizontalFade);
      space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * horizontalFade;

      float totalLineIntensity = 0.0;
      
      // COFFEE BACKGROUND COLORS (Light Paper/Cream)
      vec4 bgColor1 = vec4(0.996, 0.988, 0.980, 1.0); // #FEFCFA
      vec4 bgColor2 = vec4(0.95, 0.92, 0.89, 1.0);    // Slightly darker beige for gradient

      for(int l = 0; l < linesPerGroup; l++) {
        float normalizedLineIndex = float(l) / float(linesPerGroup);
        float offsetTime = iTime * offsetSpeed;
        float offsetPosition = float(l) + space.x * offsetFrequency;
        float rand = random(offsetPosition + offsetTime) * 0.5 + 0.5;
        float halfWidth = mix(minLineWidth, maxLineWidth, rand * horizontalFade) / 2.0;
        float offset = random(offsetPosition + offsetTime * (1.0 + normalizedLineIndex)) * mix(minOffsetSpread, maxOffsetSpread, horizontalFade);
        float linePosition = getPlasmaY(space.x, horizontalFade, offset);
        float line = drawSmoothLine(linePosition, halfWidth, space.y) / 2.0 + drawCrispLine(linePosition, halfWidth * 0.15, space.y);

        float circleX = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
        vec2 circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
        float circle = drawCircle(circlePosition, 0.01, space) * 4.0;

        line = line + circle;
        totalLineIntensity += line * rand;
      }

      // Mix Logic for Dark Lines on Light Background
      // We start with the background gradient
      vec4 bg = mix(bgColor1, bgColor2, uv.x);
      
      // We fade the edges of the whole effect
      float fade = verticalFade * horizontalFade * 0.8; 
      
      // We mix the background with the line color based on intensity
      // Intensity is clamped to avoid artifacts
      vec3 finalColor = mix(bg.rgb, lineColor.rgb, clamp(totalLineIntensity * fade, 0.0, 1.0));

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

    // Helper function to compile shader
    const loadShader = (gl: WebGLRenderingContext, type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error: ', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    };

    // Initialize shader program
    const initShaderProgram = (gl: WebGLRenderingContext, vsSource: string, fsSource: string) => {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        if (!vertexShader || !fragmentShader) return null;

        const shaderProgram = gl.createProgram();
        if (!shaderProgram) return null;

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Shader program link error: ', gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) {
            console.warn('WebGL not supported.');
            return;
        }

        const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
        if (!shaderProgram) return;

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, 1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            },
            uniformLocations: {
                resolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
                time: gl.getUniformLocation(shaderProgram, 'iTime'),
            },
        };

        const resizeCanvas = () => {
            // Ensure canvas matches its display size (responsive to container)
            const displayWidth = canvas.clientWidth;
            const displayHeight = canvas.clientHeight;

            if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                canvas.width = displayWidth;
                canvas.height = displayHeight;
                gl.viewport(0, 0, canvas.width, canvas.height);
            }
        };

        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(canvas);
        resizeCanvas();

        let startTime = Date.now();
        let animationFrameId: number;

        const render = () => {
            const currentTime = (Date.now() - startTime) / 1000;

            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(programInfo.program);

            // Pass resolution properly based on canvas size
            if (programInfo.uniformLocations.resolution) {
                gl.uniform2f(programInfo.uniformLocations.resolution, canvas.width, canvas.height);
            }

            if (programInfo.uniformLocations.time) {
                gl.uniform1f(programInfo.uniformLocations.time, currentTime);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                2,
                gl.FLOAT,
                false,
                0,
                0
            );
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={cn("block w-full h-full", className)}
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default ShaderBackground;
