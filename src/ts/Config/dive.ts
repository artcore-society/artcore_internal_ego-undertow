export const DIVER_CONFIG = {
	/** Metres per second. */
	cruiseSpeed: 4.2,
	sprintSpeed: 8.5,
	verticalSpeed: 3.6,
	/** Radians per second. */
	turnRate: 1.7,
	/** How quickly velocity follows intent (higher = snappier). */
	acceleration: 1.8,
	drag: 1.2,
	radius: 0.9,
	/** Closest the diver gets to the surface. */
	surfaceMargin: 1.2,
	floorMargin: 1.1
} as const;

export const OXYGEN_CONFIG = {
	/** Seconds a full tank lasts at the surface, swimming calmly. */
	capacity: 210,
	/** Extra drain per metre of depth (air is denser down there). */
	depthFactor: 0.006,
	sprintFactor: 1.9,
	/** Tank fraction refilled per second inside an air pocket. */
	refillRate: 0.35,
	lowThreshold: 0.22
} as const;
