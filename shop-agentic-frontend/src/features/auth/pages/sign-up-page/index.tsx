import { ArrowRight, Globe, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_PATHS } from "../../../../app/route-config";
import { Form, FormInput } from "../../../../shared/components/form";
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  SectionCard,
  Spinner,
} from "../../../../shared/components/ui";
import { useSignUpProfileForm } from "../../hooks/use-sign-up-profile-form";
import { useSignUpSubmit } from "../../hooks/use-sign-up-submit";
import { SignUpProfileFormValues } from "../../types/sign-up-profile-types";
import styles from "./index.module.scss";

const getOptionalString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : undefined;

function SignUpPage() {
  const {
    acceptedTerms,
    onAgreementChange,
    onGoogleSignUp,
    onEmailSignUp,
    isGoogleConnected,
    currentUser,
    isSubmitting,
    submitError,
    agreementError,
  } = useSignUpSubmit();
  const { profileForm, onProfileSubmit, isSubmittingProfile, profileError } =
    useSignUpProfileForm();

  const profileName =
    getOptionalString(currentUser?.displayName) ||
    getOptionalString(currentUser?.email) ||
    "User";
  const profilePhoto = getOptionalString(currentUser?.photoURL);

  return (
    <div className={styles["sign-up-page"]}>
      <div className={styles["sign-up-container"]}>
        <header className={styles["sign-up-header"]}>
          <h1>shop-agentic</h1>
          <p>Good things must share!</p>
        </header>

        <SectionCard className={styles.card} unstyled>
          {isGoogleConnected ? (
            <>
              <h2 className={styles["profile-title"]}>
                Create profile to connect
                <br />
                to the community nearest to you.
              </h2>

              <div className={styles["profile-avatar-wrap"]}>
                <Avatar size={92} name={profileName} src={profilePhoto} />
              </div>

              <Form
                form={profileForm}
                onSubmit={onProfileSubmit}
                className={styles["profile-form"]}
              >
                <FormInput<SignUpProfileFormValues>
                  name="mobileNumber"
                  label="Mobile Number"
                  type="tel"
                  placeholder="Mobile Number"
                  wrapperClassName={styles["profile-field"]}
                />

                <FormInput<SignUpProfileFormValues>
                  name="postalCode"
                  label="Postal Code"
                  placeholder="Postal Code"
                  wrapperClassName={styles["profile-field"]}
                />

                <Button
                  type="submit"
                  fullWidth
                  className={styles["next-btn"]}
                  variant="primary"
                  disabled={isSubmittingProfile}
                >
                  {isSubmittingProfile ? (
                    <span className={styles["button-loading"]}>
                      <Spinner size={16} className={styles["button-spinner"]} />
                      SAVING...
                    </span>
                  ) : (
                    <>
                      <ArrowRight size={16} />
                      NEXT
                    </>
                  )}
                </Button>
              </Form>

              {profileError ? (
                <Alert className={styles["submit-error"]} tone="error">
                  {profileError}
                </Alert>
              ) : null}
            </>
          ) : (
            <>
              <h2>Join The Community</h2>

              <div className={styles["actions-group"]}>
                <Button
                  type="button"
                  fullWidth
                  className={styles["google-btn"]}
                  variant="outline"
                  onClick={onGoogleSignUp}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className={styles["button-loading"]}>
                      <Spinner size={16} className={styles["button-spinner"]} />
                      CONNECTING...
                    </span>
                  ) : (
                    <>
                      <Globe size={16} />
                      Continue with Google
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  fullWidth
                  className={styles["email-btn"]}
                  variant="primary"
                  onClick={onEmailSignUp}
                  disabled={isSubmitting}
                >
                  <Mail size={16} />
                  Sign Up with Email
                </Button>
              </div>

              <div className={styles["terms-section"]}>
                <Checkbox
                  id="marketing-consent"
                  label="I want to receive account summary information, special offers and marketing communication from Shop Agentic through email or SMS."
                  checked={acceptedTerms}
                  onChange={(event) => onAgreementChange(event.target.checked)}
                  wrapperClassName={styles.checkbox}
                />

                {agreementError ? (
                  <Alert className={styles["agreement-error"]} tone="error">
                    {agreementError}
                  </Alert>
                ) : null}

                {submitError ? (
                  <Alert className={styles["submit-error"]} tone="error">
                    {submitError}
                  </Alert>
                ) : null}

                <p className={styles.policy}>
                  By signing up to Shop Agentic, I agree Shop Agentic&apos;s
                  <Link to={APP_PATHS.signIn}> Terms of Service </Link>
                  and
                  <Link to={APP_PATHS.signIn}> Privacy Policy</Link>
                </p>
              </div>

              <p className={styles["footer-link"]}>
                Already have an account?{" "}
                <Link to={APP_PATHS.signIn}>Sign in</Link>
              </p>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export default SignUpPage;
