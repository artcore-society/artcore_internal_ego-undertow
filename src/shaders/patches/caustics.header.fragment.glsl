#include ../includes/caustics.glsl

uniform float uTime;
uniform float uCausticStrength;
uniform vec3 uCausticTint;
uniform float uSurfaceY;

varying vec3 vCausticWorld;
varying float vCausticUp;
