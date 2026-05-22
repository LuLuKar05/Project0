  import { prisma } from '@/lib/prisma'
  import { NextResponse } from 'next/server'

  export async function GET() {
    try {
      const projects = await prisma.project.findMany({
        where: { active: true },
        include: {
          orbit:  true,
          visual: true,
        },
        orderBy: { order: 'asc' },
      })
      return NextResponse.json(projects)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }
  }
