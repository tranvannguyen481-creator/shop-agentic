import styles from "./index.module.scss";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: number;
  className?: string;
}

function Avatar({
  src,
  alt = "avatar",
  name = "U",
  size = 40,
  className,
}: AvatarProps) {
  const initials = name
    .trim()
    .split(" ")
    .map((token) => token[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return src ? (
    <img
      className={`${styles.avatar} ${className ?? ""}`.trim()}
      style={{ width: size, height: size }}
      src={src}
      alt={alt}
    />
  ) : (
    <span
      className={`${styles.avatar} ${styles.fallback} ${className ?? ""}`.trim()}
      style={{ width: size, height: size }}
      aria-label={alt}
    >
      {initials}
    </span>
  );
}

export default Avatar;
