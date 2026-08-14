import type { ProfileTranslation } from '../profile'

export const profileEn: ProfileTranslation = {
  name: 'Chen Cheng',
  headline: 'Frontend Tech Lead | Complex Systems & Full-Stack Delivery',
  headlineEn: 'Frontend Tech Lead / Full Stack Engineer',
  summary: [
    'Frontend and full-stack engineer with 10+ years of experience and a long-term track record of leading frontend teams of 4–8 people. Earlier roles covered end-to-end ownership across clients, services, databases, and deployment; recent work has focused on architecture and core development for large operations consoles, business SDKs, cross-platform applications, and internal platforms.',
    'React is my primary stack, complemented by hands-on Node.js, Python, PHP, Go, database, container, and deployment experience. I can own API design, data processing, service deployment, and frontend–backend integration.',
  ],
  availability:
    'Currently considering AI Agent engineering, Full Stack Engineer, and frontend opportunities.',
  strengths: [
    'Taking over, analyzing, incrementally migrating, and modernizing large B2B systems.',
    'Able to expand into adjacent technologies as product needs change: React work in a part-time travel project in 2015, a frontend-tool startup in 2017, then React Native, PHP / Python services, and spatial statistics during the Baidu period and concurrent team projects.',
    'Design and development of React systems, micro-frontends, reusable components, and business SDKs.',
    'Long-term leadership of frontend teams of 4–8, including requirements breakdown, technical design, code review, and cross-team collaboration.',
  ],
  experience: [
    {
      company: 'Meican',
      role: 'Frontend Lead',
      start: '2019.11',
      end: '2026.06',
      period: '2019.11—2026.06',
      overview:
        'Led the frontend team at Meican and owned architecture and core development for large operations consoles, cross-platform payments, business SDKs, and internal platforms.',
      highlights: [
        {
          title: 'Large consoles and architecture modernization',
          bullets: [
            'Took over and maintained a large operations console, gradually migrating legacy pages and extracting shared capabilities while the business continued to evolve.',
            'Designed a micro-frontend host that centralized navigation, authorization, and application loading while allowing business apps to develop, release, and roll back independently.',
            'Designed layered pages and state recovery so deep operations could be restored from the URL, reducing migration and cross-version compatibility issues.',
            'Resolved difficult browser compatibility, build and release, production stability, routing, and complex-interaction issues.',
          ],
        },
        {
          title: 'SDKs and shared modules',
          bullets: [
            'Packaged payments, analytics, resource-management, and finance pages as internal SDKs that consumers could integrate with a container and parameters.',
            'Unified inputs, outputs, process states, and error formats across Web and Mini Programs, keeping platform differences inside adapters.',
            'Initiated an operations-console design system and packaged common components, design tokens, and usage examples for reuse.',
          ],
        },
        {
          title: 'Team leadership and engineering quality',
          bullets: [
            'Led frontend teams of 4–8 over the long term: decomposed requirements, assigned work, set technical direction, reviewed code, and helped other teams solve technical problems.',
            'Introduced branch conventions, quality checks, automated builds, and release workflows to reduce rework in multi-person delivery.',
            'Built internal prototypes that used LLMs for workflow analysis, test-path generation, and knowledge organization.',
          ],
        },
      ],
    },
    {
      company: 'Baidu',
      role: 'Senior R&D Engineer',
      start: '2017.11',
      end: '2019.11',
      period: '2017.11—2019.11',
      overview:
        'Led five frontend engineers across complex SVG map-data operations, spatial statistics, and the Baijiahao article editor, while directly contributing PHP / Python data services and batch-processing delivery.',
      highlights: [
        {
          title: 'Map operations, backend services, and spatial statistics',
          bullets: [
            'Contributed core work to complex map operations, delivering layered loading, spatial search, and editing for roads, tracks, GPS, and business annotations on an existing internal SVG map system.',
            'Led PHP / Yii2 crowdsourced-statistics services, metrics APIs, and Python batch jobs, and extended asynchronous QA, callback deduplication, and JSONB exception analysis in Python / PostgreSQL; correlated Elasticsearch count / search / scroll results with MySQL business data.',
          ],
        },
        {
          title: 'Baijiahao editor',
          bullets: [
            'Contributed to the long-term evolution of Baijiahao’s article editor, building business plugins on UEditor 1.4.3 and addressing selection, paste, toolbar-state, and multi-instance rich-text edge cases.',
            'Helped turn years of customized UEditor code into an internal reusable package by modularizing the core, cleaning dependencies and plugin boundaries, and supporting both React imports and browser-script integration.',
          ],
        },
      ],
    },
    {
      company: 'Beijing Dujia Technology Co., Ltd.',
      role: 'Lead Desktop App / Full-Stack Engineer',
      start: '2017.03',
      end: '2017.11',
      period: '2017.03—2017.11',
      overview:
        'Owned a high-fidelity prototyping editor, mobile preview, server integration, and commercial features for the public website.',
      highlights: [
        {
          title: '',
          bullets: [
            'Built a cross-platform desktop editor with core editing capabilities, an event system, and mobile preview.',
            'Designed and developed interaction among the desktop editor, mobile client, and backend services.',
            'Built the website homepage, project sharing, and paid features.',
          ],
        },
      ],
    },
    {
      company: 'Sanya Wangwang Information Technology Co., Ltd.',
      role: 'Head of Engineering',
      start: '2015.08',
      end: '2017.03',
      period: '2015.08—2017.03',
      overview:
        'Led engineering across a React H5 client, Yii2 services, MySQL / Redis, and server deployment and maintenance.',
      highlights: [
        {
          title: '',
          bullets: [
            'Built the H5 client with React and Webpack and designed the frontend–backend API contract.',
            'Built Yii2, MySQL, and Redis services covering products, orders, guides, carts, users, authorization, and report exports.',
            'Provisioned servers and owned deployment and routine maintenance.',
          ],
        },
      ],
    },
    {
      company: 'Itrip',
      role: 'Senior Engineer',
      start: '2012.09',
      end: '2015.08',
      period: '2012.09—2015.08',
      overview:
        'Developed an overseas supplier console, a foundational flight database, and internal data systems.',
      highlights: [
        {
          title: '',
          bullets: [
            'Independently built an overseas supplier console covering orders, inventory, reporting, and data analysis.',
            'Built a flight database covering flights, aircraft types, airlines, and airports.',
            'Developed destination, analytics, and supplier systems for the main site.',
          ],
        },
      ],
    },
  ],
  education: [
    {
      degree: "Bachelor's degree",
      school: 'Hubei Normal University',
      major: 'Computer Science and Technology',
    },
  ],
  skills: [
    {
      label: 'Frontend',
      items: ['React', 'Redux', 'Vue', 'JavaScript', 'TypeScript', 'Webpack', 'Rollup', 'Next.js'],
    },
    {
      label: 'Backend and data',
      items: ['Node.js', 'Python', 'PHP', 'Go', 'MySQL', 'PostgreSQL', 'Redis', 'MongoDB'],
    },
    {
      label: 'Cross-platform and engineering',
      items: ['Electron', 'React Native', 'Docker', 'Linux', 'Nginx', 'Elasticsearch (project experience)', 'Kafka (project experience)'],
    },
  ],
  selfEvaluation: [
    'I value clear, maintainable code and prefer direct, easy-to-understand implementations.',
    'I can take over legacy systems and complex problems, then decompose and improve them while the business remains live.',
    'My technical decisions balance business goals, team cost, and long-term maintenance.',
  ],
}
