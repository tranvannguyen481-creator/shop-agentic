import { Eye, EyeOff, Globe, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_PATHS } from "../../../../app/route-config";
import { Form, FormInput } from "../../../../shared/components/form";
import {
  Alert,
  Button,
  SectionCard,
  Spinner,
} from "../../../../shared/components/ui";
import { usePinVisibility } from "../../hooks/use-pin-visibility";
import { useSignInForm } from "../../hooks/use-sign-in-form";
import { useSignInSubmit } from "../../hooks/use-sign-in-submit";
import { SignInFormValues } from "../../types/sign-in-types";
import styles from "./index.module.scss";

function SignInPage() {
  const form = useSignInForm();
  const { showPin, pinInputType, togglePinVisibility } = usePinVisibility();
  const { onSubmit, onGoogleSignIn, isSubmitting, submitError } =
    useSignInSubmit();

  return (
    <div className={styles["sign-in-page"]}>
      <div className={styles["sign-in-container"]}>
        <header className={styles["sign-in-header"]}>
          <div className={styles.logo}>
            <h1>shop-agentic</h1>
            <span>Good things must share!</span>
          </div>
          <div className={styles.bubble}>
            To find out more about Shop Agentic,{" "}
            <a href="#about">click here!</a>
          </div>
        </header>

        <SectionCard className={styles.card} unstyled>
          <h2>Connect Me To The Community!</h2>

          <Form form={form} onSubmit={onSubmit} className={styles.form}>
            <FormInput<SignInFormValues>
              name="email"
              label="Email address"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              wrapperClassName={styles.field}
            />

            <FormInput<SignInFormValues>
              name="pin"
              requiredMark={false}
              label={
                <div className={styles["pin-row"]}>
                  <span className={styles["pin-label"]}>
                    PIN <em>*</em>
                  </span>
                  <Link to={APP_PATHS.signIn}>Forgot?</Link>
                </div>
              }
              type={pinInputType}
              placeholder="Enter 4-6 digit PIN"
              autoComplete="current-password"
              trailingAction={
                <button
                  type="button"
                  className={styles["toggle-pin"]}
                  onClick={togglePinVisibility}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              wrapperClassName={styles.field}
            />

            <Button
              type="submit"
              fullWidth
              className={styles["login-btn"]}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className={styles["button-loading"]}>
                  <Spinner size={16} className={styles["button-spinner"]} />
                  LOGGING IN...
                </span>
              ) : (
                <>
                  <LogIn size={16} />
                  LOGIN
                </>
              )}
            </Button>

            {submitError ? (
              <Alert className={styles["submit-error"]} tone="error">
                {submitError}
              </Alert>
            ) : null}
          </Form>

          <div className={styles.divider}>OR</div>

          <Button
            type="button"
            fullWidth
            className={styles["google-btn"]}
            variant="outline"
            onClick={onGoogleSignIn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className={styles["button-loading"]}>
                <Spinner size={16} className={styles["google-spinner"]} />
                CONNECTING...
              </span>
            ) : (
              <>
                <Globe size={16} />
                Continue with Google
              </>
            )}
          </Button>

          <div className={styles["footer-links"]}>
            <p className={styles["sign-up-text"]}>
              Not a member? <Link to={APP_PATHS.signUp}>Sign up Now</Link>
            </p>

            <p className={styles["back-home"]}>
              <Link to={APP_PATHS.landing}>Back to Home</Link>
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default SignInPage;
