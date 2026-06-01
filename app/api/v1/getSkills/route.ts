import { prisma } from '@/lib/prisma'; 
import { NextResponse } from 'next/server';
export async function GET() {
    try{
        const categories = await prisma.skillCategory.findMany({
            orderBy: { displayOrder: 'asc' },
            include: {
                skills: {
                    select: {
                        name: true,
                    }
                }
            },
        });
        const result = categories.map(category => ({
            name: category.name,
            skills: category.skills.map(skill => ({
                name: skill.name,
            }))
        }));
        return NextResponse.json(result);
    }catch(error){
        console.error('Failed to fetch skills:', error)
        return NextResponse.json(
            { error: 'Failed to fetch skills' },
            { status: 500 }
        )
    }

}