import app from "@/app/app";
import logger from "@/shared/utils/logger";

const PORT = process.env["PORT"] ?? 5000;

app.listen(PORT, () => {
  logger.info(`Backend running on port ${PORT}`, {
    env: process.env["NODE_ENV"] ?? "development",
  });
});
