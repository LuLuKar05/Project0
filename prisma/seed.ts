import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ── Clean in dependency order ──────────────────────────────────────────────
  await prisma.skill.deleteMany()
  await prisma.skillCategory.deleteMany()
  await prisma.planetVisual.deleteMany()
  await prisma.orbitConfig.deleteMany()
  await prisma.project.deleteMany()   // cascades to _ProjectToTag junction
  await prisma.tag.deleteMany()

  // ── Tags (hardcoded reference data — projects select from these) ───────────
  console.log('📌 Seeding tags...')

  await prisma.tag.createMany({
    data: [
      // achievement
      { name: '1st Prize',       category: 'achievement',  color: '#FFD700' },
      { name: '2nd Prize',       category: 'achievement',  color: '#C0C0C0' },
      { name: '3rd Prize',       category: 'achievement',  color: '#CD7F32' },
      { name: 'Dual Prize',      category: 'achievement',  color: '#FF9500' },
      { name: 'Finalist',        category: 'achievement',  color: '#4FC3F7' },
      // project type
      { name: 'Hackathon',       category: 'project type', color: '#FF6B6B' },
      { name: 'Freelance',       category: 'project type', color: '#68A063' },
      { name: 'Personal',        category: 'project type', color: '#8E44AD' },
      { name: 'Open Source',     category: 'project type', color: '#F39C12' },
      // framework
      { name: 'Next.js 16',      category: 'framework',    color: '#ffffff' },
      { name: 'React 19',        category: 'framework',    color: '#61DAFB' },
      { name: 'FastAPI',         category: 'framework',    color: '#009688' },
      { name: 'LangGraph',       category: 'framework',    color: '#FF6B6B' },
      { name: 'Express',         category: 'framework',    color: '#8BC34A' },
      { name: 'Tailwind',        category: 'framework',    color: '#38BDF8' },
      // language
      { name: 'TypeScript',      category: 'language',     color: '#3178C6' },
      { name: 'Python',          category: 'language',     color: '#3572A5' },
      { name: 'JavaScript',      category: 'language',     color: '#F7DF1E' },
      { name: 'Solidity',        category: 'language',     color: '#AA6746' },
      // runtime
      { name: 'Node.js',         category: 'runtime',      color: '#68A063' },
      // database
      { name: 'MongoDB',         category: 'database',     color: '#47A248' },
      { name: 'PostgreSQL',      category: 'database',     color: '#336791' },
      { name: 'SQLite',          category: 'database',     color: '#003B57' },
      // ai / ml
      { name: 'Gemini',          category: 'ai / ml',      color: '#4285F4' },
      { name: 'Multi-Agent',     category: 'ai / ml',      color: '#9B59B6' },
      { name: 'AI Agents',       category: 'ai / ml',      color: '#E91E63' },
      { name: 'FLock LLM',       category: 'ai / ml',      color: '#FF6B2B' },
      // web3
      { name: 'Ethereum',        category: 'web3',         color: '#627EEA' },
      { name: 'Concordium',      category: 'web3',         color: '#FF6B2B' },
      { name: 'DeFi',            category: 'web3',         color: '#F7931A' },
      { name: 'Smart Contracts', category: 'web3',         color: '#8BC34A' },
      // feature
      { name: 'Zero-Knowledge',  category: 'feature',      color: '#2ECC71' },
      { name: 'Privacy',         category: 'feature',      color: '#8E44AD' },
      { name: 'QR System',       category: 'feature',      color: '#4FC3F7' },
      { name: 'Real-time',       category: 'feature',      color: '#FF5252' },
    ],
  })

  // Helper — look up a tag by name (throws early if a name has a typo)
  const allTags = await prisma.tag.findMany()
  const tag = (name: string) => {
    const found = allTags.find(t => t.name === name)
    if (!found) throw new Error(`Tag not found: "${name}"`)
    return { id: found.id }
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  console.log('🪐 Seeding projects...')

  await prisma.project.create({
    data: {
      slug:        'drift-land',
      title:       'DRIFT LAND 154',
      category:    'PLATFORM',
      date:        new Date('2026-01-01'),
      shortDesc:   'Enterprise event management & ticketing. Next.js 16, MongoDB, QR validation.',
      fullDesc:    'Full-scale enterprise event management & ticketing platform featuring real-time QR code validation, multi-vendor dashboards, attendee analytics, and an automated communications pipeline.',
      tags:        { connect: [tag('Freelance'), tag('Next.js 16'), tag('Node.js'), tag('MongoDB'), tag('QR System'), tag('Real-time')] },
      githubURL:   null,
      deployedURL: null,
      active:      true,
      order:       0,
      orbit:  { create: { radius: 3.8,  speed: 0.120, inclination: 0.5 } },
      visual: { create: { textureUrl: '/textures/planet-blue.jpg',   sz: 0.32, rotationSpeed: 0.30, glowIntensity: 0.6 } },
    },
  })

  await prisma.project.create({
    data: {
      slug:        'nutrishield',
      title:       'NUTRISHIELD',
      category:    'AI + PRIVACY',
      date:        new Date('2026-01-01'),
      shortDesc:   'Zero-knowledge biodefense assistant. Real-time threat-adapted meal plans.',
      fullDesc:    'Privacy-first biodefense nutrition assistant leveraging zero-knowledge proofs and multi-agent AI orchestration for real-time, threat-adapted dietary planning.',
      tags:        { connect: [tag('Hackathon'), tag('FastAPI'), tag('AI Agents'), tag('Zero-Knowledge'), tag('Privacy')] },
      githubURL:   'https://github.com/LuLuKar05/biodefense-nutrition',
      deployedURL: null,
      active:      true,
      order:       1,
      orbit:  { create: { radius: 6.0,  speed: 0.080, inclination: 2.3 } },
      visual: { create: { textureUrl: '/textures/planet-orange.jpg', sz: 0.36, rotationSpeed: 0.25, glowIntensity: 0.7 } },
    },
  })

  await prisma.project.create({
    data: {
      slug:        'afterverse',
      title:       'AFTERVERSE',
      category:    'MULTI-AGENT AI',
      date:        new Date('2025-01-01'),
      shortDesc:   'Automating post-death legal workflows. 1st place — 700 participants.',
      fullDesc:    'Award-winning multi-agent system automating complex post-death legal and administrative workflows. Secured 1st place at UCL AgentVerse hackathon against 700 participants.',
      tags:        { connect: [tag('1st Prize'), tag('Hackathon'), tag('Multi-Agent'), tag('LangGraph'), tag('Gemini'), tag('FastAPI')] },
      githubURL:   'https://github.com/LuLuKar05/Afterversed',
      deployedURL: null,
      active:      true,
      order:       2,
      orbit:  { create: { radius: 8.2,  speed: 0.055, inclination: 4.5 } },
      visual: { create: { textureUrl: '/textures/planet-gold.jpg',   sz: 0.38, rotationSpeed: 0.20, glowIntensity: 0.5 } },
    },
  })

  await prisma.project.create({
    data: {
      slug:        'veriloan',
      title:       'VERILOAN',
      category:    'WEB3 + DEFI',
      date:        new Date('2025-01-01'),
      shortDesc:   'Under-collateralized lending via cryptographic identity bridging.',
      fullDesc:    'Decentralized lending protocol enabling under-collateralized loans through cryptographic identity bridging between Ethereum and Concordium blockchain networks.',
      tags:        { connect: [tag('Dual Prize'), tag('Hackathon'), tag('Ethereum'), tag('Concordium'), tag('Solidity'), tag('DeFi')] },
      githubURL:   'https://github.com/LuLuKar05/VeriLoan',
      deployedURL: null,
      active:      true,
      order:       3,
      orbit:  { create: { radius: 10.5, speed: 0.038, inclination: 1.2 } },
      visual: { create: { textureUrl: '/textures/planet-grey.jpg',   sz: 0.28, rotationSpeed: 0.35, glowIntensity: 0.4 } },
    },
  })

  await prisma.project.create({
    data: {
      slug:        'classified-1',
      title:       'CLASSIFIED',
      category:    'UPCOMING',
      date:        new Date('2026-01-01'),
      shortDesc:   'Mission parameters pending.',
      fullDesc:    '',
      active:      false,
      order:       4,
      orbit:  { create: { radius: 13.5, speed: 0.022, inclination: 3.8 } },
      visual: { create: { textureUrl: '/textures/planet-dark.jpg',   sz: 0.24, rotationSpeed: 0.10, glowIntensity: 0.1 } },
    },
  })

  await prisma.project.create({
    data: {
      slug:        'classified-2',
      title:       'CLASSIFIED',
      category:    'UPCOMING',
      date:        new Date('2026-01-01'),
      shortDesc:   'Mission parameters pending.',
      fullDesc:    '',
      active:      false,
      order:       5,
      orbit:  { create: { radius: 16.0, speed: 0.016, inclination: 5.9 } },
      visual: { create: { textureUrl: '/textures/planet-dark.jpg',   sz: 0.22, rotationSpeed: 0.10, glowIntensity: 0.1 } },
    },
  })

  // ── SkillCategories + Skills ───────────────────────────────────────────────
  console.log('⭐ Seeding skill categories...')

  const skillData = [
    { name: 'Languages', displayOrder: 0, skills: ['Python', 'JavaScript', 'TypeScript', 'Solidity', 'HTML / CSS'] },
    { name: 'Frontend',  displayOrder: 1, skills: ['React 19', 'Next.js 16', 'Tailwind', 'App Router'] },
    { name: 'Backend',   displayOrder: 2, skills: ['Node.js', 'Express', 'FastAPI', 'MongoDB', 'SQLite'] },
    { name: 'AI / ML',   displayOrder: 3, skills: ['LangGraph', 'Gemini', 'FLock LLM', 'Multi-Agent'] },
    { name: 'Web3',      displayOrder: 4, skills: ['Ethereum', 'Concordium', 'Smart Contracts', 'DeFi'] },
    { name: 'DevOps',    displayOrder: 5, skills: ['Git', 'Docker', 'JWT', 'Playwright', 'Monorepo'] },
  ]

  for (const cat of skillData) {
    await prisma.skillCategory.create({
      data: {
        name:         cat.name,
        displayOrder: cat.displayOrder,
        skills:       { create: cat.skills.map(name => ({ name, description: '' })) },
      },
    })
  }

  console.log('✅ Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
