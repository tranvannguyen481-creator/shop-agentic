import { useState } from "react";

export function usePinVisibility() {
  const [showPin, setShowPin] = useState(false);

  const togglePinVisibility = () => {
    setShowPin((currentValue) => !currentValue);
  };

  return {
    showPin,
    pinInputType: showPin ? "text" : "password",
    togglePinVisibility,
  };
}
