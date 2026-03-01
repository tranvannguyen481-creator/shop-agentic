import { Eye, EyeOff, UserPlus } from "lucide-react";
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
import { useSignUpEmail } from "../../hooks/use-sign-up-email";
import { SignUpEmailFormValues } from "../../types/sign-up-email-types";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.signUpEmail;

function SignUpEmailPage() {
  const { form, onSubmit, isSubmitting, submitError, successMessage } =
    useSignUpEmail();
  const {
    showPin: showPassword,
    pinInputType: passwordInputType,
    togglePinVisibility: togglePasswordVisibility,
  } = usePinVisibility();
  const {
    showPin: showConfirm,
    pinInputType: confirmInputType,
    togglePinVisibility: toggleConfirmVisibility,
  } = usePinVisibility();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>shop-agentic</h1>
          <p>Good things must share!</p>
        </header>

        <SectionCard className={styles.card} unstyled>
          <h2>Tạo tài khoản mới</h2>

          <Form
            form={form}
            onSubmit={onSubmit}
            className={styles.form}
          >
            <FormInput<SignUpEmailFormValues>
              name="fullName"
              label="Họ và tên"
              type="text"
              placeholder="Nhập họ và tên"
              autoComplete="name"
              wrapperClassName={styles.field}
            />

            <FormInput<SignUpEmailFormValues>
              name="email"
              label="Email"
              type="email"
              placeholder="Nhập địa chỉ email"
              autoComplete="email"
              wrapperClassName={styles.field}
            />

            <FormInput<SignUpEmailFormValues>
              name="password"
              label="Mật khẩu"
              type={passwordInputType}
              placeholder="Ít nhất 8 ký tự"
              autoComplete="new-password"
              wrapperClassName={styles.field}
              trailingAction={
                <button
                  type="button"
                  className={styles["toggle-btn"]}
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <FormInput<SignUpEmailFormValues>
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              type={confirmInputType}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              wrapperClassName={styles.field}
              trailingAction={
                <button
                  type="button"
                  className={styles["toggle-btn"]}
                  onClick={toggleConfirmVisibility}
                  aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Button
              type="submit"
              fullWidth
              variant="primary"
              className={styles["submit-btn"]}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>
                  <Spinner size={16} />
                  &nbsp;ĐANG XỬ LÝ...
                </span>
              ) : (
                <>
                  <UserPlus size={16} />
                  &nbsp;ĐĂNG KÝ
                </>
              )}
            </Button>
          </Form>

          {successMessage ? (
            <Alert className={styles.alert} tone="success">
              {successMessage}
            </Alert>
          ) : null}

          {submitError ? (
            <Alert className={styles.alert} tone="error">
              {submitError}
            </Alert>
          ) : null}

          <p className={styles["footer-link"]}>
            Đã có tài khoản?{" "}
            <Link to={APP_PATHS.signIn}>Đăng nhập</Link>
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

export default SignUpEmailPage;
