import { Megaphone, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_PATHS } from "../../../../app/route-config";
import { Button, SectionCard } from "../../../../shared/components/ui";
import styles from "./index.module.scss";

function LandingPage() {
  return (
    <div className={styles["landing-page"]}>
      <header className={styles["top-bar"]}>
        <div className={styles.brand}>
          <h1>shop-agentic</h1>
          <span>Good Things Must Share!</span>
        </div>
        <p className={styles["login-text"]}>
          Have an account? <Link to={APP_PATHS.signIn}>Login here</Link>
        </p>
      </header>

      <main className={styles["page-content"]}>
        <SectionCard className={styles["hero-card"]} unstyled>
          <img
            src="/logo512.png"
            alt="Shop Agentic app"
            className={styles["hero-image"]}
          />

          <h2>
            Welcome to <span>Shop Agentic!</span>
          </h2>

          <p>
            Buying together has never been easier — save more, share more, and
            enjoy exclusive deals as a community.
          </p>

          <p className={styles["stats-text"]}>
            So far, we’ve hosted <strong>9,288 events</strong>, bringing
            together <strong>7,904 members</strong> across{" "}
            <strong>215 groups</strong>.
          </p>

          <div className={styles["cta-row"]}>
            <Button
              type="button"
              variant="outline"
              className={`${styles["cta-button"]} ${styles["cta-button-outline"]}`}
            >
              <Users size={16} />
              Join as member
            </Button>
            <Button type="button" className={styles["cta-button"]}>
              <Megaphone size={16} />
              Join as Host
            </Button>
          </div>

          <div className={styles["feature-grid"]}>
            <article>
              <h3>What is Group-buy?</h3>
              <p>Learn how people buy together to get better prices.</p>
            </article>
            <article>
              <h3>Our Story</h3>
              <p>Explore the mission behind Shop Agentic and our community.</p>
            </article>
            <article>
              <h3>Be Our Partners</h3>
              <p>Grow with us as a supplier, host, or logistics partner.</p>
            </article>
          </div>
        </SectionCard>

        <SectionCard className={styles["explain-section"]} unstyled>
          <h3>What is Group-buy?</h3>
          <p>
            Group-buy is a collective purchasing model where multiple buyers
            come together to place a single, consolidated order with a supplier.
          </p>
          <p>
            By aggregating demand, group-buy enables suppliers to optimize
            pricing and logistics, while customers benefit from cost savings and
            convenience.
          </p>
          <p>
            Shop Agentic supports food, daily essentials, lifestyle products,
            and seasonal items within trusted community-based networks.
          </p>
        </SectionCard>
      </main>

      <footer className={styles["page-footer"]}>
        <div>
          <a href="#contact">Contact us</a>
          <p>And we will get back to you.</p>
        </div>
        <div>
          <p>We are growing but committed to your privacy.</p>
          <a href="#privacy">Our Privacy Statement</a>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
