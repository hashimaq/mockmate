/**
 * Configurable company hiring profiles.
 * Add new companies here — do not scatter company logic across the app.
 */

export type CompanyProfile = {
  id: string;
  name: string;
  hiringPhilosophy: string;
  behavioralFocus: string[];
  technicalEmphasis: string[];
  leadershipExpectations: string[];
  preferredInterviewStyle: string;
  /** Short initials for avatar fallback */
  initials: string;
};

export const CUSTOM_COMPANY_ID = "__custom__" as const;
export const NO_COMPANY_ID = "__none__" as const;

export const COMPANY_PROFILES: readonly CompanyProfile[] = [
  {
    id: "google",
    name: "Google",
    hiringPhilosophy:
      "Hire for strong general cognitive ability, role-related knowledge, and Googleyness — collaboration and humility under ambiguity.",
    behavioralFocus: ["Communication", "Collaboration", "Learning agility"],
    technicalEmphasis: [
      "Problem solving",
      "Algorithms",
      "Scalability",
      "System design fundamentals",
    ],
    leadershipExpectations: [
      "Influence without authority",
      "Clear structured thinking",
    ],
    preferredInterviewStyle:
      "Structured technical + behavioral probes; emphasize clarity of thought.",
    initials: "G",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    hiringPhilosophy:
      "Growth mindset, customer focus, and ability to collaborate across large product ecosystems.",
    behavioralFocus: ["Growth mindset", "Inclusion", "Customer obsession"],
    technicalEmphasis: [
      "Practical engineering",
      "Cloud fundamentals",
      "Product trade-offs",
    ],
    leadershipExpectations: ["Cross-team collaboration", "Ownership"],
    preferredInterviewStyle:
      "Mix of coding, design, and behavioral stories with impact metrics.",
    initials: "MS",
  },
  {
    id: "amazon",
    name: "Amazon",
    hiringPhilosophy:
      "Bar-raising ownership grounded in Leadership Principles and customer obsession.",
    behavioralFocus: [
      "Leadership Principles",
      "Ownership",
      "Customer Obsession",
      "STAR Method",
    ],
    technicalEmphasis: [
      "Scalable systems",
      "Operational excellence",
      "Data-driven decisions",
    ],
    leadershipExpectations: ["Bias for action", "Dive deep", "Deliver results"],
    preferredInterviewStyle:
      "Heavy STAR behavioral interviews plus practical technical depth.",
    initials: "A",
  },
  {
    id: "meta",
    name: "Meta",
    hiringPhilosophy:
      "Move fast with high coding bar, product sense, and strong peer collaboration.",
    behavioralFocus: ["Collaboration", "Impact", "Handling ambiguity"],
    technicalEmphasis: ["Coding", "Product thinking", "Performance & scale"],
    leadershipExpectations: ["Drive impact", "Give and receive feedback"],
    preferredInterviewStyle:
      "Coding-heavy with product/collaboration follow-ups.",
    initials: "M",
  },
  {
    id: "apple",
    name: "Apple",
    hiringPhilosophy:
      "Craft excellence, privacy-minded design, and deep ownership of polished experiences.",
    behavioralFocus: ["Attention to detail", "Collaboration", "User empathy"],
    technicalEmphasis: [
      "Quality engineering",
      "Performance",
      "Platform constraints",
    ],
    leadershipExpectations: ["Cross-functional clarity", "High craft standards"],
    preferredInterviewStyle:
      "Deep technical discussion with product quality and craft focus.",
    initials: "Ap",
  },
  {
    id: "netflix",
    name: "Netflix",
    hiringPhilosophy:
      "Freedom and responsibility — high talent density, candor, and ownership.",
    behavioralFocus: ["Candor", "Judgment", "Self-motivation"],
    technicalEmphasis: [
      "Distributed systems",
      "Reliability",
      "Data-informed decisions",
    ],
    leadershipExpectations: ["Independent ownership", "Context over control"],
    preferredInterviewStyle:
      "Senior-level judgment interviews with technical depth.",
    initials: "N",
  },
  {
    id: "openai",
    name: "OpenAI",
    hiringPhilosophy:
      "Research-minded builders who reason carefully about AI systems and real-world impact.",
    behavioralFocus: ["Curiosity", "Intellectual honesty", "Collaboration"],
    technicalEmphasis: [
      "AI knowledge",
      "Reasoning",
      "Systems thinking",
      "Research mindset",
    ],
    leadershipExpectations: ["Clarity under uncertainty", "Safety awareness"],
    preferredInterviewStyle:
      "Reasoning-heavy technical conversations with systems and research angles.",
    initials: "OA",
  },
  {
    id: "tesla",
    name: "Tesla",
    hiringPhilosophy:
      "First-principles engineering, urgency, and hands-on problem solving.",
    behavioralFocus: ["Urgency", "Ownership", "Resilience"],
    technicalEmphasis: [
      "Practical engineering",
      "Hardware/software integration awareness",
      "Optimization",
    ],
    leadershipExpectations: ["Bias for action", "Hands-on leadership"],
    preferredInterviewStyle:
      "Direct technical challenges with real-world constraints.",
    initials: "T",
  },
  {
    id: "nvidia",
    name: "NVIDIA",
    hiringPhilosophy:
      "Deep technical excellence in accelerated computing and systems performance.",
    behavioralFocus: ["Technical rigor", "Collaboration", "Learning speed"],
    technicalEmphasis: [
      "Performance",
      "Parallel thinking",
      "Systems architecture",
    ],
    leadershipExpectations: ["Technical mentorship", "Precision"],
    preferredInterviewStyle:
      "Deep technical interviews with performance and systems focus.",
    initials: "NV",
  },
  {
    id: "stripe",
    name: "Stripe",
    hiringPhilosophy:
      "Operators who write clear code, think in systems, and care about user trust.",
    behavioralFocus: ["Clarity", "Ownership", "User empathy"],
    technicalEmphasis: [
      "API design",
      "Reliability",
      "Security awareness",
      "Product sense",
    ],
    leadershipExpectations: ["Written communication", "Cross-team impact"],
    preferredInterviewStyle:
      "Practical coding plus product/system design discussions.",
    initials: "S",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    hiringPhilosophy:
      "Builders who love edge systems, performance, and internet-scale reliability.",
    behavioralFocus: ["Curiosity", "Ownership", "Collaboration"],
    technicalEmphasis: [
      "Networking fundamentals",
      "Distributed systems",
      "Performance",
    ],
    leadershipExpectations: ["Practical leadership", "Clear escalation"],
    preferredInterviewStyle:
      "Hands-on technical interviews with systems and reliability focus.",
    initials: "CF",
  },
  {
    id: "shopify",
    name: "Shopify",
    hiringPhilosophy:
      "Merchant-obsessed builders who ship iteratively and think in product outcomes.",
    behavioralFocus: ["Merchant obsession", "Collaboration", "Adaptability"],
    technicalEmphasis: [
      "Full-stack delivery",
      "Product engineering",
      "Scalable commerce systems",
    ],
    leadershipExpectations: ["Outcome ownership", "Mentorship"],
    preferredInterviewStyle:
      "Practical full-stack and product-oriented interviews.",
    initials: "Sh",
  },
  {
    id: "gitlab",
    name: "GitLab",
    hiringPhilosophy:
      "Remote-first collaboration, async communication, and strong DevOps culture.",
    behavioralFocus: ["Async communication", "Transparency", "Collaboration"],
    technicalEmphasis: ["DevOps", "CI/CD", "Secure software delivery"],
    leadershipExpectations: ["Written clarity", "Inclusive leadership"],
    preferredInterviewStyle:
      "Values + practical engineering with remote collaboration signals.",
    initials: "GL",
  },
  {
    id: "atlassian",
    name: "Atlassian",
    hiringPhilosophy:
      "Teamwork-centered product builders who value inclusion and pragmatic engineering.",
    behavioralFocus: ["Teamwork", "Inclusion", "Customer focus"],
    technicalEmphasis: [
      "Product engineering",
      "Scalable SaaS",
      "Developer experience",
    ],
    leadershipExpectations: ["Collaboration", "Mentoring"],
    preferredInterviewStyle:
      "Balanced technical and teamwork/behavioral interviews.",
    initials: "At",
  },
  {
    id: "oracle",
    name: "Oracle",
    hiringPhilosophy:
      "Enterprise-grade engineering with strong fundamentals in data and reliability.",
    behavioralFocus: ["Accountability", "Stakeholder communication"],
    technicalEmphasis: ["Databases", "Enterprise systems", "Cloud services"],
    leadershipExpectations: ["Delivery discipline", "Cross-org alignment"],
    preferredInterviewStyle:
      "Fundamentals-heavy technical interviews with enterprise scenarios.",
    initials: "Or",
  },
  {
    id: "ibm",
    name: "IBM",
    hiringPhilosophy:
      "Enterprise consulting mindset with structured problem solving and client focus.",
    behavioralFocus: ["Client communication", "Structured thinking"],
    technicalEmphasis: [
      "Enterprise architecture",
      "Cloud",
      "Integration patterns",
    ],
    leadershipExpectations: ["Stakeholder management", "Mentorship"],
    preferredInterviewStyle:
      "Structured behavioral + technical scenario interviews.",
    initials: "IBM",
  },
  {
    id: "sap",
    name: "SAP",
    hiringPhilosophy:
      "Enterprise process expertise with reliable delivery and cross-functional clarity.",
    behavioralFocus: ["Process discipline", "Collaboration"],
    technicalEmphasis: [
      "Enterprise applications",
      "Integrations",
      "Data integrity",
    ],
    leadershipExpectations: ["Delivery ownership", "Client alignment"],
    preferredInterviewStyle:
      "Domain + technical interviews with enterprise delivery focus.",
    initials: "SAP",
  },
  {
    id: "systems-limited",
    name: "Systems Limited",
    hiringPhilosophy:
      "Practical full-stack delivery with strong OOP, SQL, and professional communication.",
    behavioralFocus: ["Communication", "Team collaboration", "Ownership"],
    technicalEmphasis: ["Full Stack", "OOP", "SQL", "Clean implementation"],
    leadershipExpectations: ["Mentorship readiness", "Client communication"],
    preferredInterviewStyle:
      "Practical coding and system questions with communication checks.",
    initials: "SL",
  },
  {
    id: "arbisoft",
    name: "Arbisoft",
    hiringPhilosophy:
      "Practical development excellence, clean code, and strong team collaboration.",
    behavioralFocus: ["Team collaboration", "Ownership", "Communication"],
    technicalEmphasis: [
      "Practical development",
      "Clean code",
      "Problem solving",
    ],
    leadershipExpectations: ["Peer mentoring", "Delivery ownership"],
    preferredInterviewStyle:
      "Hands-on practical interviews emphasizing clean, maintainable code.",
    initials: "Ar",
  },
  {
    id: "10pearls",
    name: "10Pearls",
    hiringPhilosophy:
      "Client-focused product engineering with adaptable full-stack delivery.",
    behavioralFocus: ["Client communication", "Adaptability"],
    technicalEmphasis: ["Full-stack delivery", "APIs", "Quality"],
    leadershipExpectations: ["Delivery ownership", "Mentorship"],
    preferredInterviewStyle:
      "Practical engineering interviews with communication emphasis.",
    initials: "10P",
  },
  {
    id: "contour-software",
    name: "Contour Software",
    hiringPhilosophy:
      "Reliable product engineering with attention to maintainability and process.",
    behavioralFocus: ["Ownership", "Communication", "Team fit"],
    technicalEmphasis: ["Software fundamentals", "Testing", "Maintainability"],
    leadershipExpectations: ["Process discipline", "Peer support"],
    preferredInterviewStyle:
      "Fundamentals + practical problem-solving interviews.",
    initials: "CS",
  },
  {
    id: "devsinc",
    name: "Devsinc",
    hiringPhilosophy:
      "Fast-learning engineers who ship practical features and collaborate tightly.",
    behavioralFocus: ["Learning speed", "Collaboration"],
    technicalEmphasis: ["Full-stack fundamentals", "APIs", "Debugging"],
    leadershipExpectations: ["Initiative", "Clear updates"],
    preferredInterviewStyle:
      "Practical coding interviews with collaboration signals.",
    initials: "Ds",
  },
  {
    id: "careem",
    name: "Careem",
    hiringPhilosophy:
      "Customer-obsessed product builders solving real marketplace and scale problems.",
    behavioralFocus: ["Customer focus", "Ownership", "Ambiguity"],
    technicalEmphasis: [
      "Scalable services",
      "Product thinking",
      "Mobile/backend collaboration",
    ],
    leadershipExpectations: ["Cross-functional impact", "Bias for action"],
    preferredInterviewStyle:
      "Product + technical interviews with real-world scale scenarios.",
    initials: "Ca",
  },
  {
    id: "motive",
    name: "Motive",
    hiringPhilosophy:
      "High-ownership builders solving operational and fleet/tech product challenges.",
    behavioralFocus: ["Ownership", "Urgency", "Communication"],
    technicalEmphasis: [
      "Backend systems",
      "Data pipelines awareness",
      "Product reliability",
    ],
    leadershipExpectations: ["Execution focus", "Cross-team clarity"],
    preferredInterviewStyle:
      "Practical technical interviews with ownership-heavy behavioral probes.",
    initials: "Mo",
  },
  {
    id: "tkxel",
    name: "Tkxel",
    hiringPhilosophy:
      "Consulting-ready engineers who communicate clearly and deliver client outcomes.",
    behavioralFocus: ["Client communication", "Adaptability"],
    technicalEmphasis: ["Full-stack delivery", "Integrations", "Quality"],
    leadershipExpectations: ["Stakeholder updates", "Mentorship"],
    preferredInterviewStyle:
      "Practical + communication-focused interview loops.",
    initials: "Tk",
  },
  {
    id: "venturedive",
    name: "VentureDive",
    hiringPhilosophy:
      "Product-minded engineers who balance speed, quality, and collaboration.",
    behavioralFocus: ["Collaboration", "Ownership", "Communication"],
    technicalEmphasis: [
      "Practical engineering",
      "Clean architecture",
      "Delivery",
    ],
    leadershipExpectations: ["Team facilitation", "Mentorship"],
    preferredInterviewStyle:
      "Balanced technical and behavioral interviews.",
    initials: "VD",
  },
  {
    id: "programmers-force",
    name: "Programmers Force",
    hiringPhilosophy:
      "Strong fundamentals, practical coding ability, and professional communication.",
    behavioralFocus: ["Communication", "Team fit", "Ownership"],
    technicalEmphasis: ["DSA fundamentals", "OOP", "Web development"],
    leadershipExpectations: ["Peer support", "Clear explanations"],
    preferredInterviewStyle:
      "Fundamentals-first interviews with practical coding tasks.",
    initials: "PF",
  },
] as const;

export type KnownCompanyId = (typeof COMPANY_PROFILES)[number]["id"];

export function listCompanyOptions(): Array<{ id: string; name: string }> {
  return COMPANY_PROFILES.map((profile) => ({
    id: profile.id,
    name: profile.name,
  }));
}

export function getCompanyProfileById(id: string): CompanyProfile | null {
  return COMPANY_PROFILES.find((profile) => profile.id === id) ?? null;
}

export function getCompanyProfileByName(name: string): CompanyProfile | null {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;
  return (
    COMPANY_PROFILES.find(
      (profile) => profile.name.toLowerCase() === normalized,
    ) ?? null
  );
}

/** Generic profile used for custom / unknown company names. */
export function buildCustomCompanyProfile(companyName: string): CompanyProfile {
  const name = companyName.trim() || "Custom Company";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);

  return {
    id: "custom",
    name,
    hiringPhilosophy:
      "Adapt to this company's likely hiring bar using role, seniority, and industry norms.",
    behavioralFocus: [
      "Communication",
      "Ownership",
      "Collaboration",
      "Problem solving",
    ],
    technicalEmphasis: [
      "Role-relevant fundamentals",
      "Practical implementation",
      "Trade-off reasoning",
    ],
    leadershipExpectations: ["Clear ownership", "Stakeholder communication"],
    preferredInterviewStyle:
      "Balanced technical and behavioral interview adapted to the stated company.",
    initials: initials || "C",
  };
}
