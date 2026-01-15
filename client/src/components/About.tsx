import './About.css';

function About() {
  return (
    <div className="about-container">
      <div className="about-content">
        <h1>About Shuckle Codes</h1>

        <section className="about-section">
          <h2>Who I Am</h2>
          <p>
            Welcome to Shuckle Codes! I'm a technology enthusiast passionate about exploring
            the intersection of gadgets, code, and creativity. This blog is my space to share
            discoveries, reviews, tutorials, and insights from my journey through the ever-evolving
            world of technology.
          </p>
        </section>

        <section className="about-section">
          <h2>What You'll Find Here</h2>
          <p>
            At Shuckle Codes, you'll discover:
          </p>
          <ul>
            <li><strong>Gadget Reviews:</strong> Honest, hands-on reviews of the latest tech products</li>
            <li><strong>Coding Tutorials:</strong> Practical guides and tips for developers</li>
            <li><strong>Tech Explorations:</strong> Deep dives into interesting technologies and concepts</li>
            <li><strong>Creative Projects:</strong> Personal projects combining hardware and software</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Why Shuckle Codes?</h2>
          <p>
            The name combines my love for technology (codes) with a touch of personality.
            Whether you're a fellow developer, gadget enthusiast, or just curious about
            technology, I hope you'll find something here that inspires or helps you.
          </p>
        </section>

        <section className="about-section">
          <h2>Get In Touch</h2>
          <p>
            Have questions or suggestions? Feel free to reach out through the contact
            information on the site. I'm always interested in connecting with fellow
            tech enthusiasts!
          </p>
        </section>
      </div>
    </div>
  );
}

export default About;
