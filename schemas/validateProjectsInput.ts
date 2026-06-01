import type { Project } from '@/lib/types'

export type ValidatedProjectInput =
  Omit<Project, 'id'|'slug'|'createdAt' | 'updatedAt' | 'orbit' | 'visual' | 'active' | 'tags'> & {
    active?: boolean;
    tagIds?: number[];
}

type validatedResult =
  | { ok: true;  data: ValidatedProjectInput }
  | { ok: false; field: string; error: string; message: string }

//Helper Function 
const isNonEmptyString = (v: unknown): v is string =>
    typeof v === 'string' && v.trim().length > 0
const isValidUrl = (v: unknown): boolean => {
    if(typeof v !== 'string') return false
    try{
        const url = new URL(v)
        return url.protocol === 'https:' || url.protocol === 'http:'
    }catch{
        return false
    }
}
/** 
 * slug   - There won't user input for this feild will be automatically generated at the service layer.
 * Note: About the Tag, I haven't done anything yet
 *      - Need to validate the tag.
 *      - also need to update the returned tag data
 */

export function validateProjectInput(body: any): validatedResult {
    //Required string fields validation
    const requiredFields: Array<keyof ValidatedProjectInput> = ['title', 'category', 'date','shortDesc', 'fullDesc',]
    for(const field of requiredFields){
        if(!isNonEmptyString(body[field])){
            return {
                ok: false,
                field: field,
                error: 'INVALID_INPUT',
                message: `${field} is required and must be a non-empty string.`
            }
        }
    }
    const parsedDate = Date.parse(body.date)
    if(isNaN(parsedDate)){
        return {
            ok: false,
            field: 'date',
            error: 'INVALID_INPUT',
            message: 'date must be a valid ISO 8601 date string.'
        }
    }
    //NEED TO IMPLEMENT: Tag validation.
    /**
     *
     * Tag Validation Code.
     */
    if(body.tagIds != null){
        if(!Array.isArray(body.tagIds) || !body.tagIds.every((id: unknown) => typeof id === 'number' && Number.isInteger(id) && id > 0)){
            return {
                ok: false,
                field: 'tagIds',
                error: 'INVALID_INPUT',
                message: 'tagIds must be an array of positive integers.'
            }
        }
    }

    //OPTION: Order validation
    if(body.order != null){
        if(typeof body.order !== 'number' || !Number.isInteger(body.order) || body.order < 1){
            return {
                ok: false,
                field: 'order',
                error: 'INVALID_INPUT',
                message: 'order must be a positive integer.'
            }
        }
    }
    //OPTION: githubURL and deployedURL validation
    if(body.githubURL != null && !isValidUrl(body.githubURL)){
        return {
            ok: false,
            field: 'githubURL',
            error: 'INVALID_INPUT',
            message: 'githubURL must be a valid HTTP or HTTPS URL.'
        }
    }
    if(body.deployedURL != null && !isValidUrl(body.deployedURL)){
        return {
            ok: false,
            field: 'deployedURL',
            error: 'INVALID_INPUT',
            message: 'deployedURL must be a valid HTTP or HTTPS URL.'
        }
    }

    return{
        ok: true,
        data: {
            title: body.title.trim(),
            category: body.category?.trim() || 'Uncategorized',
            date: new Date(parsedDate),
            shortDesc: body.shortDesc.trim(),
            fullDesc: body.fullDesc.trim(),
            order: body.order,
            githubURL: body.githubURL?.trim() || null,
            deployedURL: body.deployedURL?.trim() || null,
            tagIds: Array.isArray(body.tagIds) ? body.tagIds.map(Number).filter((n: number) => Number.isFinite(n) && n > 0) : [],
        }
    }

}