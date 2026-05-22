  import { prisma } from '@/lib/prisma'
  import { NextResponse } from 'next/server'

  export async function POST(req: Request) {
    try {
      const { firstName, lastName, email, message } = await req.json()

      // Basic validation
      if (!firstName || !lastName || !email) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      const submission = await prisma.contactMessage.create({
        data: { firstName, lastName, email, message },
      })

      return NextResponse.json(
        { success: true, id: submission.id },
        { status: 201 }
      )
    } catch (error) {
      console.error('Failed to save message:', error)
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }
  }
