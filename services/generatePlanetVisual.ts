import {PlanetVisual} from '@/lib/types';
//Generate a Planet's Visual based on the Orbit slot(order) of the project.
//The properties of Planet are already hardcoded, will be reusing. 
//Currently 8 textures, 8 size variations, 5 rotation speeds and 3 glow levels. 
//Has to devided by the array.length to make sure the cycle works for any number of projects.

//Note: can used this with the GET projects and didn't store in the db at all, just created these data at runtime.
//But for the sake of performace at server side, I will generate these data at the time of project creation and store in the db, so when we fetch the projects, we already have the visual and orbit data ready to use.
export function generatePlanetVisual(order: number, textureUrl?: string, sz?: number, rotationSpeed?: number, glowIntensity?: number): Omit<PlanetVisual, 'id' | 'projectId'> {
    const PLANET_TEXTURES = [
        '/textures/planet-1.jpg',
        '/textures/planet-2.jpg',
        '/textures/planet-3.jpg',
        '/textures/planet-4.jpg',
        '/textures/planet-5.jpg',
        '/textures/planet-6.jpg',
        '/textures/planet-7.jpg',
        '/textures/planet-8.jpg',
    ]
    const SIZE_CYCLE          = [1.0, 1.3, 0.8, 1.6, 1.1, 0.9, 1.4, 1.2]
    const ROTATION_SPEED_CYCLE = [0.5, 0.8, 0.4, 1.0, 0.6]
    const GLOW_CYCLE           = [0.4, 0.6, 0.3]

    const idx = order - 1  //The Id is going to be 0 based.
    return{
        textureUrl:         textureUrl ?? PLANET_TEXTURES[idx % PLANET_TEXTURES.length],
        sz:                 sz ?? SIZE_CYCLE[idx % SIZE_CYCLE.length],
        rotationSpeed:      rotationSpeed ?? ROTATION_SPEED_CYCLE[idx % ROTATION_SPEED_CYCLE.length],
        glowIntensity:      glowIntensity ?? GLOW_CYCLE[idx % GLOW_CYCLE.length],
    } as Omit<PlanetVisual, 'id' | 'projectId'>
}