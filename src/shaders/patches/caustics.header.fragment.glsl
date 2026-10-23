#include ../includes/caustics.glsl
#include ../includes/bell.glsl

uniform float uTime;
uniform float uCausticStrength;
uniform vec3 uCausticTint;
uniform float uSurfaceY;
uniform vec3 uPingOrigin;
uniform float uPingRadius;

varying vec3 vCausticWorld;
varying float vCausticUp;
