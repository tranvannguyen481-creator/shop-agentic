import { Search } from "lucide-react";
import { ChangeEvent, memo } from "react";
import { Input } from "../ui";
import styles from "./index.module.scss";

interface SearchBarProps {
  placeholder?: string;
  ariaLabel?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

function SearchBar({
  placeholder = "Search",
  ariaLabel = "Search",
  value,
  onValueChange,
}: SearchBarProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(event.target.value);
  };

  return (
    <div className={styles.search}>
      <Search className={styles["search-icon"]} aria-hidden="true" />
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        wrapperClassName={styles["search-field"]}
        className={styles["search-input"]}
      />
    </div>
  );
}

export default memo(SearchBar);
