"use client";

import { useEffect, useState } from "react";
import { credentials, metrics, portfolio, projects, writing } from "./content";
import { HeroWaterScene } from "./HeroWaterScene";

const navItems = ["home", "projects", "about", "writing", "contact"] as const;

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-panorama">
        <HeroWaterScene />
      </div>
      <div className="atmosphere">
        {Array.from({ length: 8 }, (_, index) => (
          <i key={index} className={`mote mote-${index + 1}`} />
        ))}
      </div>
    </div>
  );
}

function Header({ active }: { active: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="monogram" href="#home" aria-label="Akshay Pai, home">
        <span>A</span>P
      </a>
      <button
        className="menu-button"
        type="button"
        aria-expanded={open}
        aria-controls="site-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="sr-only">Toggle navigation</span>
        <i />
        <i />
      </button>
      <nav id="site-navigation" className={open ? "nav-open" : ""} aria-label="Primary navigation">
        {navItems.map((item) => (
          <a
            key={item}
            href={`#${item}`}
            className={active === item ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            {item}
          </a>
        ))}
        <a className="resume-button" href={portfolio.resumeUrl} download>
          Resume <Arrow diagonal />
        </a>
      </nav>
    </header>
  );
}

function SocialRail() {
  return (
    <aside className="social-rail" aria-label="Social links">
      <span className="rail-line" />
      <a href={portfolio.socials.linkedin} aria-label="LinkedIn">in</a>
      <a href={portfolio.socials.github} aria-label="GitHub">gh</a>
      <a href={`mailto:${portfolio.email}`} aria-label="Email">@</a>
    </aside>
  );
}

function MetricStrip() {
  return (
    <div className="metric-strip" aria-label="Career highlights">
      {metrics.map((metric) => (
        <div className="metric" key={metric.label}>
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProjectCard({ project, index }: { project: (typeof projects)[number]; index: number }) {
  return (
    <article className="project-card">
      <div className={`project-art project-art-${index + 1}`}>
        <span>{project.code}</span>
      </div>
      <div className="project-card-copy">
        <p className="eyebrow">{project.category}</p>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <a href={project.href} aria-label={`Explore ${project.title}`}>
          View system <Arrow />
        </a>
      </div>
    </article>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const sections = navItems
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-25% 0px -60%", threshold: [0.05, 0.25, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <main>
      <Header active={activeSection} />
      <section id="home" className="hero" aria-labelledby="hero-title">
        <HeroVisual />
        <div className="hero-copy">
          <p className="eyebrow">{portfolio.role}</p>
          <h1 id="hero-title">{portfolio.name}</h1>
          <p className="hero-intro">{portfolio.intro}</p>
          <a className="text-link" href="#projects">
            Explore my work <span aria-hidden="true">↓</span>
          </a>
        </div>
        <SocialRail />
        <MetricStrip />
      </section>

      <section id="projects" className="projects-section section-pad" aria-labelledby="projects-title">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Selected systems</p>
            <h2 id="projects-title">Intelligence, made useful.</h2>
          </div>
          <a className="text-link compact-link" href="#project-grid">View all projects <Arrow /></a>
        </div>

        <div className="featured-case">
          <div className="case-copy">
            <p className="eyebrow">Featured case study / 01</p>
            <h3>Asset Retrieval<br />Chatbot</h3>
            <p>An intelligent natural-language interface for tracking enterprise assets across time, location and events.</p>
            <ul>
              <li>Temporal reasoning</li>
              <li>Trace history and movement</li>
              <li>Context-aware follow-ups</li>
              <li>SQL + LLM orchestration</li>
            </ul>
            <a className="text-link compact-link" href="#project-grid">Explore case study <Arrow /></a>
          </div>
          <div className="case-demo" role="img" aria-label="Dark asset tracking interface showing locations connected across a map">
            <div className="demo-query">
              <span>Where was asset A123 yesterday?</span>
              <strong>Asset A123 was at Mumbai Warehouse on June 30, 2026 — 10:42 AM.</strong>
            </div>
            <div className="map-lines" />
            {[1, 2, 3, 4, 5, 6].map((dot) => <i key={dot} className={`map-dot dot-${dot}`} />)}
            <div className="event-log">
              <small>Dell Latitude 7490</small>
              <span>→ Mumbai Warehouse <time>10:42 AM</time></span>
              <span>→ Pune Office <time>03:21 PM</time></span>
              <span>→ Mumbai Warehouse <time>07:11 PM</time></span>
            </div>
          </div>
        </div>

        <div id="project-grid" className="project-grid">
          {projects.map((project, index) => <ProjectCard key={project.title} project={project} index={index} />)}
        </div>
      </section>

      <section id="about" className="about-section section-pad" aria-labelledby="about-title">
        <div className="about-intro">
          <p className="eyebrow">About / Credentials</p>
          <h2 id="about-title">Formal training.<br /><em>Real-world impact.</em></h2>
          <p>{portfolio.about}</p>
        </div>
        <div className="credential-grid">
          {credentials.map((credential) => (
            <article className="credential-card" key={credential.title}>
              <span className={`credential-mark ${credential.tone}`}>{credential.mark}</span>
              <div>
                <h3>{credential.title}</h3>
                <p>{credential.issuer}</p>
                <small>{credential.year}</small>
              </div>
              <Arrow diagonal />
            </article>
          ))}
        </div>
      </section>

      <section id="writing" className="writing-section section-pad" aria-labelledby="writing-title">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Field notes</p>
            <h2 id="writing-title">What I&apos;m thinking about.</h2>
          </div>
        </div>
        <div className="writing-list">
          {writing.map((article, index) => (
            <a href={article.href} className="writing-item" key={article.title}>
              <span>0{index + 1}</span>
              <div><h3>{article.title}</h3><p>{article.summary}</p></div>
              <small>{article.readTime}</small>
              <Arrow diagonal />
            </a>
          ))}
        </div>
      </section>

      <section id="contact" className="contact-section section-pad" aria-labelledby="contact-title">
        <div className="planet" aria-hidden="true"><i /><i /></div>
        <div className="contact-copy">
          <p className="eyebrow">Start a conversation</p>
          <h2 id="contact-title">Let&apos;s build something<br /><em>meaningful.</em></h2>
          <p>Open to thoughtful collaborations, ambitious systems, and conversations about what intelligence can become.</p>
          <a className="outline-button" href={`mailto:${portfolio.email}`}>Get in touch <Arrow /></a>
        </div>
        <footer>
          <span>© 2026 {portfolio.name}</span>
          <span>Designed with curiosity. Built locally.</span>
        </footer>
      </section>
    </main>
  );
}
