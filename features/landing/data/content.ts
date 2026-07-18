import { NAV_LINKS } from "@/lib/constants";
import type {
  FaqItem,
  Feature,
  FooterLinkGroup,
  HowItWorksStep,
} from "@/types";

export const FEATURES: Feature[] = [
  {
    id: "realistic-mock-interviews",
    icon: "MessageSquare",
    title: "Realistic Mock Interviews",
    description:
      "Practice technical and behavioral interviews that mirror real hiring conversations, not canned quizzes.",
  },
  {
    id: "instant-ai-feedback",
    icon: "Sparkles",
    title: "Instant AI Feedback",
    description:
      "Get clear, actionable coaching on clarity, structure, depth, and delivery after every answer.",
  },
  {
    id: "progress-tracking",
    icon: "TrendingUp",
    title: "Progress Tracking",
    description:
      "See how your confidence and performance improve over time with session history and insights.",
  },
  {
    id: "role-specific-practice",
    icon: "Briefcase",
    title: "Role-Specific Practice",
    description:
      "Prepare for software engineering, product, data, and HR roles with tailored question sets.",
  },
  {
    id: "practice-anytime",
    icon: "Clock",
    title: "Practice Anytime",
    description:
      "No scheduling friction. Open a session when you have 15 minutes and keep your skills sharp.",
  },
  {
    id: "private-secure",
    icon: "Shield",
    title: "Private & Secure",
    description:
      "Your practice sessions stay yours. Built with enterprise-grade privacy and security practices.",
  },
];

export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    id: "create-account",
    step: 1,
    title: "Create Account",
    description: "Sign up in seconds and set your target role and experience level.",
  },
  {
    id: "choose-interview",
    step: 2,
    title: "Choose Interview",
    description: "Pick technical, HR, or mixed sessions matched to your goals.",
  },
  {
    id: "practice",
    step: 3,
    title: "Practice",
    description: "Answer questions in a focused, interview-like environment.",
  },
  {
    id: "receive-ai-feedback",
    step: 4,
    title: "Receive AI Feedback",
    description: "Review strengths, gaps, and concrete next steps after each session.",
  },
];

export const FAQS: FaqItem[] = [
  {
    id: "what-is-mockmate",
    question: "What is MockMate?",
    answer:
      "MockMate is an AI-powered interview preparation platform. Practice realistic mock interviews, receive structured feedback, and track your progress over time.",
  },
  {
    id: "who-is-it-for",
    question: "Who is MockMate for?",
    answer:
      "Students, career switchers, and working professionals preparing for technical, product, data, or HR interviews.",
  },
  {
    id: "how-feedback-works",
    question: "How does the AI feedback work?",
    answer:
      "After each session, MockMate analyzes your responses for clarity, structure, relevance, and depth — then surfaces practical improvements you can apply next time.",
  },
  {
    id: "technical-and-hr",
    question: "Can I practice both technical and HR interviews?",
    answer:
      "Yes. You can choose technical, behavioral/HR, or mixed sessions depending on the role you are targeting.",
  },
  {
    id: "free-plan",
    question: "Is there a free plan?",
    answer:
      "Pricing details are coming soon. Early access users will get priority invitation and launch benefits.",
  },
  {
    id: "scheduling",
    question: "Do I need to schedule live sessions?",
    answer:
      "No. Practice on your own schedule — MockMate is available whenever you want to prepare.",
  },
];

export const FOOTER_LINKS: FooterLinkGroup[] = [
  {
    title: "Product",
    links: NAV_LINKS,
  },
];
