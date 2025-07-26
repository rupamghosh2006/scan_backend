import { defineMiddleware } from "astro:middleware";

const class11MathChapters = [
  "Sets",
  "Relations and Functions",
  "Trigonometric Functions",
  "Principle of Mathematical Induction",
  "Complex Numbers and Quadratic Equations",
  "Linear Inequalities",
  "Permutations and Combinations",
  "Binomial Theorem",
  "Sequences and Series",
  "Straight Lines",
  "Conic Sections",
  "Introduction to Three Dimensional Geometry",
  "Limits and Derivatives",
  "Mathematical Reasoning",
  "Statistics",
  "Probability"
];

const class12MathChapters = [
  "Relations and Functions",
  "Inverse Trigonometric Functions",
  "Matrices",
  "Determinants",
  "Continuity and Differentiability",
  "Applications of Derivatives",
  "Integrals",
  "Applications of Integrals",
  "Differential Equations",
  "Vectors",
  "Three Dimensional Geometry",
  "Linear Programming",
  "Probability"
];

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.chapters = {
    class11: class11MathChapters,
    class12: class12MathChapters,
  };

  const res = await fetch("http://localhost:4000/api/v1/tick");
  const data = await res.json();

  context.locals.serverTime = data.time;

  return next();
});

// Optional exports for use anywhere
export const class11Chap = () => class11MathChapters;
export const class12Chap = () => class12MathChapters;