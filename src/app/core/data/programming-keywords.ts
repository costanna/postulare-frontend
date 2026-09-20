export interface KeywordGroup {
  id: string;
  terms: string[];
}

/** Palabras clave habituales en ofertas de programación. Una palabra por término: la búsqueda acepta cualquiera de ellas. */
export const PROGRAMMING_KEYWORDS: KeywordGroup[] = [
  {
    id: 'roles',
    terms: ['Desarrollador', 'Developer', 'Programador', 'Fullstack', 'Frontend', 'Backend', 'Software', 'Ingeniero', 'Analista'],
  },
  {
    id: 'languages',
    terms: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'C++', 'PHP', 'Kotlin', 'Swift', 'Go', 'Rust', 'Ruby', 'Scala', 'SQL'],
  },
  {
    id: 'frontend',
    terms: ['Angular', 'React', 'Vue', 'Next.js', 'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap', 'jQuery'],
  },
  {
    id: 'backend',
    terms: ['Spring', 'Node.js', '.NET', 'Django', 'FastAPI', 'Flask', 'Laravel', 'Express', 'NestJS', 'REST', 'GraphQL', 'Microservicios'],
  },
  {
    id: 'data',
    terms: ['PostgreSQL', 'MySQL', 'SQLServer', 'Oracle', 'MongoDB', 'Redis', 'Elasticsearch', 'ETL', 'Pandas'],
  },
  {
    id: 'devops',
    terms: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux', 'Git', 'Jenkins', 'Terraform', 'Ansible', 'DevOps'],
  },
  {
    id: 'mobile',
    terms: ['Android', 'iOS', 'Flutter', 'Xamarin'],
  },
  {
    id: 'testing',
    terms: ['QA', 'Tester', 'Selenium', 'Cypress', 'Jest', 'JUnit'],
  },
];

export function keywordTokens(text: string | null | undefined): string[] {
  return (text ?? '').split(/[\s,]+/).filter(Boolean);
}

/** Añade la palabra si no está y la quita si ya estaba (sin distinguir mayúsculas). */
export function toggleTerm(current: string[], term: string): string[] {
  const lower = term.toLowerCase();
  return current.some((t) => t.toLowerCase() === lower)
    ? current.filter((t) => t.toLowerCase() !== lower)
    : [...current, term];
}
