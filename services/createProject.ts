import { prisma }                     from '@/lib/prisma'
import {generateOrbit}                from './generateOrbit'
import {generatePlanetVisual}         from './generatePlanetVisual'
import type { Project }               from '@/lib/types'
import type { ValidatedProjectInput } from '@/schemas/validateProjectsInput'

type ServiceResult = {
    ok: boolean;
    status: number;
    project?: Project;
    error?: string;
    message?: string;
}
//Convertion form title to URL-Safe Slug
function slugify(title:string): string{
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0,80)
}


export async function createProject(input:ValidatedProjectInput): Promise<ServiceResult> {
    try{
        // create slug based on the projectTitle
        const slug = slugify(input.title);
        //Check the uniqueness of the slug?
        const existingSlug = await prisma.project.findUnique({ where: { slug } })
        if(existingSlug){
            return {
                ok: false,
                status: 409,
                error: 'SLUG_EXISTS',
                message: `A project with the slug "${slug}" already exists. Please choose a different one.`
            }
        }

        let order = input.order || 0; //Default order to 0 if not provided, but ideally we should handle this better, maybe by assigning the next available order based on the current max in the database.
        //Check if the order slot is already taken?
        const existingOrder = await prisma.project.findFirst({
            where: { order },
        })
        if(existingOrder){
            //Thinkig to generate the order based on the current max order in the database + 1, but for now just return an error
            const theLastOrder = await prisma.project.findFirst({
                orderBy: { order: 'desc' },
            })
            order = theLastOrder ? theLastOrder.order + 1 : 1
        }

        const orbit = generateOrbit(order);
        const visual = generatePlanetVisual(order);

        const project = await prisma.project.create({
            data: {
                slug,
                title: input.title,
                category: input.category,
                date: new Date(input.date),
                shortDesc: input.shortDesc,
                fullDesc: input.fullDesc,
                tags: input.tagIds?{
                    connect: input.tagIds.map(id => ({ id }))
                }: undefined,
                order,
                active: true,
                githubURL: input.githubURL,
                deployedURL: input.deployedURL,
                orbit: {create: orbit},
                visual: {create: visual},
            },
            include: {
                orbit: true,
                visual: true,
                tags: true,
            },
        })
        return {
            ok: true,
            status: 201,
            project,
        }
     }catch (error){
        console.error('[createProject] Error creating project:', error)
        return{
        ok: false,
        status: 500,
        error: 'INTERNAL_ERROR',
        message: 'createProject service function is not implemented yet'
        }

    }
}