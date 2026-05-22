import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

async function main(){
    console.log('🌱 Seeding database...')

    // Clean existing data first
    await prisma.planetVisual.deleteMany()
    await prisma.orbitConfig.deleteMany()
    await prisma.project.deleteMany()

        // ── Project 1 ──
    await prisma.project.create({
      data: {
        slug:       'drift-land',
        title:      'DRIFT LAND 154',
        category:   'PLATFORM',
        date:       new Date('2026-01-01'),
        shortDesc:  'Enterprise event management & ticketing. Next.js 16, MongoDB, QR validation.',
        fullDesc:   'Full-scale enterprise event management & ticketing platform featuring real-time QR code validation, multi-vendor dashboards, attendee analytics, and an automated communications pipeline.',
        tags:       ['Next.js 16', 'Node.js', 'MongoDB', 'QR System'],
        githubURL:  null,
        deployedURL:null,
        active:     true,
        order:      0,
        orbit: {
          create: { radius: 3.8, speed: 0.12, inclination: 0.5 }
        },
        visual: {
          create: { textureUrl: '/textures/planet-blue.jpg', sz: 0.32, rotationSpeed: 0.30, glowIntensity: 0.6 }
        },
      }
    })

    // ── Project 2 ──
    await prisma.project.create({
      data: {
        slug:       'nutrishield',
        title:      'NUTRISHIELD',
        category:   'AI + PRIVACY',
        date:       new Date('2026-01-01'),
        shortDesc:  'Zero-knowledge biodefense assistant. Real-time threat-adapted meal plans.',
        fullDesc:   'Privacy-first biodefense nutrition assistant leveraging zero-knowledge proofs and multi-agent AI orchestration for real-time, threat-adapted dietary planning.',
        tags:       ['FastAPI', 'AI Agents', 'Zero-Knowledge', 'Privacy'],
        githubURL:  'https://github.com/LuLuKar05/biodefense-nutrition',
        deployedURL:null,
        active:     true,
        order:      1,
        orbit: {
          create: { radius: 6.0, speed: 0.08, inclination: 2.3 }
        },
        visual: {
          create: { textureUrl: '/textures/planet-orange.jpg', sz: 0.36, rotationSpeed: 0.25, glowIntensity: 0.7 }
        },
      }
    })

    // ── Project 3 ──
    await prisma.project.create({
      data: {
        slug:       'afterverse',
        title:      'AFTERVERSE',
        category:   'MULTI-AGENT AI',
        date:       new Date('2025-01-01'),
        shortDesc:  'Automating post-death legal workflows. 1st place — 700 participants.',
        fullDesc:   'Award-winning multi-agent system automating complex post-death legal and administrative workflows. Secured 1st place at UCL AgentVerse hackathon against 700 participants.',
        tags:       ['LangGraph', 'Gemini', 'FastAPI', 'Multi-Agent'],
        githubURL:  'https://github.com/LuLuKar05/Afterversed',
        deployedURL:null,
        active:     true,
        order:      2,
        orbit: {
          create: { radius: 8.2, speed: 0.055, inclination: 4.5 }
        },
        visual: {
          create: { textureUrl: '/textures/planet-gold.jpg', sz: 0.38, rotationSpeed: 0.20, glowIntensity: 0.5 }
        },
      }
    })

    // ── Project 4 ──
    await prisma.project.create({
      data: {
        slug:       'veriloan',
        title:      'VERILOAN',
        category:   'WEB3 + DEFI',
        date:       new Date('2025-01-01'),
        shortDesc:  'Under-collateralized lending via cryptographic identity bridging.',
        fullDesc:   'Decentralized lending protocol enabling under-collateralized loans through cryptographic identity bridging between Ethereum and Concordium blockchain networks.',
        tags:       ['Ethereum', 'Concordium', 'Solidity', 'DeFi'],
        githubURL:  'https://github.com/LuLuKar05/VeriLoan',
        deployedURL:null,
        active:     true,
        order:      3,
        orbit: {
          create: { radius: 10.5, speed: 0.038, inclination: 1.2 }
        },
        visual: {
          create: { textureUrl: '/textures/planet-grey.jpg', sz: 0.28, rotationSpeed: 0.35, glowIntensity: 0.4 }
        },
      }
    })

    // ── Placeholder 5 ──
    await prisma.project.create({
      data: {
        slug:       'classified-1',
        title:      'CLASSIFIED',
        category:   'UPCOMING',
        date:       new Date('2026-01-01'),
        shortDesc:  'Mission parameters pending.',
        fullDesc:   '',
        tags:       ['TBD'],
        active:     false,
        order:      4,
        orbit: {
          create: { radius: 13.5, speed: 0.022, inclination: 3.8 }
        },
        visual: {
          create: { textureUrl: '/textures/planet-dark.jpg', sz: 0.24, rotationSpeed: 0.10, glowIntensity: 0.1 }
        },
      }
    })

    // ── Placeholder 6 ──
    await prisma.project.create({
      data: {
        slug:       'classified-2',
        title:      'CLASSIFIED',
        category:   'UPCOMING',
        date:       new Date('2026-01-01'),
        shortDesc:  'Mission parameters pending.',
        fullDesc:   '',
        tags:       ['TBD'],
        active:     false,
        order:      5,
        orbit: {
          create: { radius: 16.0, speed: 0.016, inclination: 5.9 }
        },
        visual: {
          create: { textureUrl: '/textures/planet-dark.jpg', sz: 0.22, rotationSpeed: 0.10, glowIntensity: 0.1 }
        },
      }
    })

    console.log('✅ Done!')
}

  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())