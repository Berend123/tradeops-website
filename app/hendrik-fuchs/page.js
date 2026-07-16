import Image from "next/image";


const socialLinks = [
  { label: "GitHub", href: "https://github.com/Berend123" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/hendrik-fuchs-1a74bba3" },
  { label: "Email", href: "mailto:masingdesign@gmail.com" },
];

const projects = [
  {
    name: "TradeOps",
    category: "Founder / Market Intelligence",
    description:
      "A market-research platform built from concept to implementation, combining software architecture, data processing, AI-assisted workflows, member delivery, and product operations.",
    href: "/",
    linkLabel: "View TradeOps",
    featured: true,
  },
  {
    name: "Bargain Bashers",
    category: "Product Engineering",
    description:
      "A software product built around practical user workflows, structured application logic, and a production-minded implementation.",
    href: "https://github.com/Berend123/BargainBahshers",
    linkLabel: "View on GitHub",
  },
  {
    name: "MarineInsight",
    category: "Data Systems",
    description:
      "A data-focused project exploring how domain information can be processed, organized, and presented as a useful software system.",
    href: "https://github.com/Berend123/MarineInsight",
    linkLabel: "View on GitHub",
  },
  {
    name: "CoreBankingApi",
    category: "Backend Architecture",
    description:
      "An API-centered banking system project focused on backend boundaries, business rules, and dependable data flows.",
    href: "https://github.com/Berend123/CoreBankingApi",
    linkLabel: "View on GitHub",
  },
  {
    name: "BrowserBridge",
    category: "Systems Tooling",
    description:
      "A technical bridge for browser-driven workflows, reflecting an interest in automation, integration, and software internals.",
    href: "https://github.com/Berend123/BrowserBridge",
    linkLabel: "View on GitHub",
  },
];

const timeline = [
  {
    period: "2011-2013",
    title: "Technical training",
    description: "Developed practical technical foundations before moving into software engineering.",
  },
  {
    period: "2013-2017",
    title: "Architectural design & technical work",
    description: "Worked in technical environments where precision, planning, and translating requirements into practical output mattered.",
  },
  {
    period: "2014-Present",
    title: "Self-directed programming",
    description: "Built programming knowledge independently through study, experimentation, and complete software projects.",
  },
  {
    period: "2017-2020",
    title: "Business software",
    description: "Built software around operational requirements, automation, data, and real business workflows.",
  },
  {
    period: "2020-Present",
    title: "Independent software development",
    description: "Delivered custom software directly to clients across web applications, backend systems, automation, and technical problem solving.",
  },
  {
    period: "Present",
    title: "Founder of TradeOps",
    description: "Leads the product vision and technical implementation of the TradeOps platform.",
  },
];

const systemsResearch = [
  {
    title: "Scope-first orchestration",
    description: "Explicit include and exclude rules, dry-run defaults, and separate execution controls keep operator intent visible.",
  },
  {
    title: "Attack-surface mapping",
    description: "Structured collection, normalization, enrichment, and graph correlation turn fragmented observations into an application map.",
  },
  {
    title: "API & JS intelligence",
    description: "Local artifacts are analyzed for API families, schemas, authentication indicators, objects, routes, and JavaScript findings.",
  },
  {
    title: "Evidence correlation",
    description: "Routes, entities, trust boundaries, diffs, and workflow transitions are connected before an analyst assigns priority.",
  },
  {
    title: "Analyst-controlled AI",
    description: "Codex is optional, invoked deliberately, and used to form hypotheses from bounded evidence rather than validate findings.",
  },
  {
    title: "Review & audit",
    description: "Machine-readable outputs, casefiles, validation reports, and append-only audit events preserve how conclusions were reached.",
  },
];

const engineeringAreas = [
  {
    index: "01",
    title: "Backend",
    description: "Building the services, interfaces, and data boundaries that keep products dependable as they grow.",
    skills: ["Python", "TypeScript", "C#", "Rust", "APIs", "Database architecture", "Backend systems"],
  },
  {
    index: "02",
    title: "Data",
    description: "Turning fragmented information into repeatable pipelines, analysis, and operational software.",
    skills: ["Data pipelines", "Analytics systems", "Geospatial processing", "Data processing", "Automation"],
  },
  {
    index: "03",
    title: "Full Stack",
    description: "Taking products from a working concept to a complete application used through real business workflows.",
    skills: ["Production web applications", "Authentication", "Real-time systems", "Business workflows"],
  },
];

export const metadata = {
  title: "Hendrik Fuchs | Founder of TradeOps",
  description:
    "Hendrik Fuchs is the founder of TradeOps, a self-taught software engineer and systems researcher from Namibia working across software, AI, data systems, and software internals.",
  alternates: {
    canonical: "/hendrik-fuchs",
  },
  openGraph: {
    title: "Hendrik Fuchs | Founder of TradeOps",
    description:
      "Founder, software engineer, and systems researcher building software systems from Namibia.",
    type: "profile",
    url: "/hendrik-fuchs",
  },
};

export default function HendrikFuchsPage() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Hendrik Fuchs",
    jobTitle: "Founder, Software Engineer, and Systems Researcher",
    description:
      "Founder of TradeOps, self-taught software engineer, and systems researcher from Namibia.",
    email: "mailto:masingdesign@gmail.com",
    url: "https://tradeops.org/hendrik-fuchs",
    sameAs: [
      "https://github.com/Berend123",
      "https://www.linkedin.com/in/hendrik-fuchs-1a74bba3",
      "https://www.fiverr.com/s/Eg3QPA0",
      "https://www.udemy.com/user/berend-fuchs/",
    ],
    worksFor: {
      "@type": "Organization",
      name: "TradeOps",
      url: "https://tradeops.org",
    },
    homeLocation: {
      "@type": "Country",
      name: "Namibia",
    },
  };

  return (
    <main className="page-shell subpage-shell founder-shell">
      <div className="background-grid" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <section className="subpage-hero founder-hero">
        <div className="founder-hero-copy">
          <span className="eyebrow">The Person Behind TradeOps</span>
          <h1>Hendrik Fuchs</h1>
          <p className="founder-role">
            <span className="founder-role-label">Founder</span>
            <span className="founder-role-separator">•</span>
            <span className="founder-role-label">Software Engineer</span>
            <span className="founder-role-separator">•</span>
            <span className="founder-role-label">Systems Researcher</span>
          </p>
          <p className="founder-intro">
            A technical founder building software systems, exploring artificial intelligence, and
            researching how technology works beneath the surface.
          </p>
          <div className="subpage-actions founder-actions">
            {socialLinks.map((link, index) => (
              <a
                key={link.label}
                className={`button ${index === 0 ? "button-primary" : "button-secondary"}`}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <aside className="founder-identity-card" aria-label="Hendrik Fuchs profile summary">
          <div className="founder-photo-frame">
            <Image
              src="/hendrik-fuchs.webp"
              alt="Hendrik Fuchs, founder of TradeOps"
              width={500}
              height={500}
              priority
              className="founder-photo"
            />
          </div>
          <div className="founder-identity-lines">
            <div>
              <span>Based in</span>
              <strong>Namibia</strong>
            </div>
            <div>
              <span>Building</span>
              <strong>TradeOps</strong>
            </div>
            <div>
              <span>Approach</span>
              <strong>Independent &amp; hands-on</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="subpage-panel founder-story-panel">
        <div className="section-heading">
          <span className="eyebrow">Founder Story</span>
          <h2>Curiosity became the path into engineering.</h2>
        </div>
        <div className="founder-story-grid">
          <div className="founder-prose">
            <p>
              Hendrik&apos;s path into technology did not begin through a traditional software
              engineering route. It began with curiosity, self-directed learning, and the need to
              understand how useful systems are actually put together.
            </p>
            <p>
              Programming became a practical way to turn that curiosity into working products. Over
              time, he built software across multiple domains, moving between backend engineering,
              data processing, automation, web applications, and lower-level systems work.
            </p>
            <p>
              The common thread is depth. Hendrik is interested not only in using a framework, but in
              understanding the architecture, data flow, and behavior beneath it. That approach
              eventually led him to found TradeOps and build the platform from the ground up.
            </p>
          </div>
          <div className="founder-path founder-timeline" aria-label="Professional timeline">
            {timeline.map((item) => (
              <div key={`${item.period}-${item.title}`} className="founder-path-step">
                <span>{item.period}</span>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="subpage-panel founder-tradeops-panel">
        <div className="founder-section-split">
          <div className="section-heading">
            <span className="eyebrow">Founder of TradeOps</span>
            <h2>From product concept to operating platform.</h2>
            <p>
              Hendrik is the founder and technical builder behind TradeOps. His role spans product
              vision, software architecture, implementation, and the operational details required to
              turn an idea into a working platform.
            </p>
          </div>
          <div className="founder-build-list">
            {["Product vision", "Software architecture", "AI-powered workflows", "Backend systems", "Data processing", "Platform implementation"].map((item) => (
              <div key={item}><span aria-hidden="true">+</span>{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="founder-section">
        <div className="section-heading">
          <span className="eyebrow">Software Engineering</span>
          <h2>Engineering across the full system.</h2>
          <p>
            The work crosses languages and layers, but the objective stays consistent: build software
            that solves a real problem and remains understandable enough to operate responsibly.
          </p>
        </div>
        <div className="founder-engineering-grid">
          {engineeringAreas.map((area) => (
            <article key={area.title} className="member-card founder-engineering-card">
              <span className="founder-card-index">{area.index}</span>
              <h3>{area.title}</h3>
              <p>{area.description}</p>
              <div className="founder-tag-list">
                {area.skills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="subpage-panel">
        <div className="section-heading">
          <span className="eyebrow">Selected Projects</span>
          <h2>Working software across different problem spaces.</h2>
          <p>
            These public projects show the range of Hendrik&apos;s engineering interests, from backend
            architecture and data systems to product workflows and technical tooling.
          </p>
        </div>
        <div className="founder-project-grid">
          {projects.map((project) => (
            <a
              key={project.name}
              className={`founder-project-card${project.featured ? " founder-project-card-featured" : ""}`}
              href={project.href}
              target={project.href.startsWith("http") ? "_blank" : undefined}
              rel={project.href.startsWith("http") ? "noreferrer" : undefined}
            >
              <span className="founder-project-category">{project.category}</span>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <span className="founder-project-link">{project.linkLabel} <span aria-hidden="true">↗</span></span>
            </a>
          ))}
        </div>
      </section>

      <section className="founder-two-column">
        <article className="subpage-panel founder-feature-panel">
          <span className="eyebrow">Teaching &amp; Knowledge Sharing</span>
          <h2>Understanding improves when it can be explained.</h2>
          <p>
            Hendrik has created and published two Udemy courses, including teaching Pine Script and
            practical programming concepts. Teaching has strengthened his ability to break technical
            ideas into understandable steps without removing the details that make them useful.
          </p>
          <a className="founder-evidence-link" href="https://www.udemy.com/user/berend-fuchs/" target="_blank" rel="noreferrer">
            View Udemy profile <span aria-hidden="true">↗</span>
          </a>
        </article>

        <article className="subpage-panel founder-feature-panel">
          <span className="eyebrow">Independent Development</span>
          <h2>Software built around real client problems.</h2>
          <p>
            As an independent software developer, Hendrik has completed more than 80 Fiverr projects.
            The work has involved building custom solutions, working directly with clients, and
            translating business requirements into technical systems that can be used in practice.
          </p>
          <a className="founder-evidence-link" href="https://www.fiverr.com/s/Eg3QPA0" target="_blank" rel="noreferrer">
            View Fiverr profile <span aria-hidden="true">↗</span>
          </a>
        </article>
      </section>

      <section className="subpage-panel founder-security-panel">
        <div className="founder-section-split">
          <div className="section-heading">
            <span className="eyebrow">Security &amp; Systems Research</span>
            <h2>Studying what software does beneath the interface.</h2>
            <p>
              Alongside software development, Hendrik maintains an interest in understanding how
              software works internally. The work is practical and exploratory, connecting reverse
              engineering techniques with better vulnerability awareness, security tooling, and more
              secure software development.
            </p>
          </div>
          <div className="founder-research-note">
            <span>Responsible Research</span>
            <p>
              All security research is performed only on systems owned by Hendrik or where explicit
              authorization has been granted.
            </p>
          </div>
        </div>

        <article className="founder-research-project">
          <div className="founder-research-project-copy">
            <span className="eyebrow">Independent Research Project / Active Prototype</span>
            <h3>Hunter Extensions &amp; ReconPilot</h3>
            <p>
              A local security-research workspace built to reduce noise without removing the operator
              from the investigation. Hunter explores an evidence handoff model for Burp Suite, while
              ReconPilot implements a Rust-based pipeline for collection planning, normalization,
              enrichment, graph correlation, prioritization, and reporting.
            </p>
            <p>
              The architecture keeps external-tool execution and AI reasoning behind separate,
              explicit controls. Model output is treated as a hypothesis that must cite available
              evidence and still requires analyst validation.
            </p>
            <a
              className="founder-evidence-link"
              href="https://github.com/Berend123/hunter-reconpilot"
              target="_blank"
              rel="noreferrer"
            >
              View project on GitHub <span aria-hidden="true">&#8599;</span>
            </a>
          </div>
          <dl className="founder-research-project-facts">
            <div>
              <dt>Languages</dt>
              <dd>Java, Rust, TypeScript</dd>
            </div>
            <div>
              <dt>Interfaces</dt>
              <dd>Burp Suite, CLI, Tauri desktop</dd>
            </div>
            <div>
              <dt>Data model</dt>
              <dd>Structured JSON / JSONL artifacts</dd>
            </div>
            <div>
              <dt>Safety model</dt>
              <dd>Scope-first, dry-run by default</dd>
            </div>
          </dl>
        </article>

        <div className="founder-research-grid-heading">
          <span className="eyebrow">What The Project Explores</span>
          <p>Concrete engineering areas represented in the current research codebase.</p>
        </div>
        <div className="founder-research-grid">
          {systemsResearch.map((item, index) => (
            <article key={item.title} className="founder-research-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="subpage-panel founder-philosophy">
        <span className="eyebrow">Research Philosophy</span>
        <blockquote>
          Technology is a tool. Building powerful systems requires equal attention to reliability,
          security, and responsible use.
        </blockquote>
        <p>
          Hendrik focuses on creating useful software while continuously improving his understanding
          of how systems behave.
        </p>
      </section>

      <section className="subpage-panel founder-contact">
        <div className="section-heading">
          <span className="eyebrow">Contact</span>
          <h2>Connect with Hendrik.</h2>
          <p>For professional conversations, project context, or technical work, use any of the links below.</p>
        </div>
        <div className="founder-contact-grid">
          {socialLinks.map((link) => (
            <a
              key={`contact-${link.label}`}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noreferrer" : undefined}
            >
              <span>{link.label}</span>
              <strong>{link.label === "Email" ? "masingdesign@gmail.com" : link.href.replace(/^https?:\/\//, "").replace(/\/$/, "")}</strong>
            </a>
          ))}
        </div>
        <div className="subpage-actions">
          <a className="button button-secondary" href="/">Back to TradeOps</a>
        </div>
      </section>
    </main>
  );
}
