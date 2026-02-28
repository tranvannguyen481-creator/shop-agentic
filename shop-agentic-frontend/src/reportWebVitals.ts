import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

type ReportCallback = Parameters<typeof onCLS>[0];

const reportWebVitals = (onPerfEntry?: ReportCallback) => {
  if (onPerfEntry) {
    onCLS(onPerfEntry);
    onINP(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
};

export default reportWebVitals;
