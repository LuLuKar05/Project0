import type { Project, OrbitConfig, PlanetVisual } from '@/lib/types'
import type { ValidatedProjectInput } from '@/controller/schema'
import {generateOrbit} from './generateOrbit'
import {generatePlanetVisual} from './generatePlanetVisual'

type ServiceResult = {
    ok: boolean;
    status: number;
    project?: Project;
    error?: string;
    message?: string;
}

export async function createProject(input: ValidatedProjectInput): Promise<ServiceResult> {

    return{
        ok: false,
        status: 500,
        error: 'INTERNAL_ERROR',
        message: 'createProject service function is not implemented yet'
    }
}