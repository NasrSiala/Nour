import app from "./app";
import { logger } from "./lib/logger";
import { runRiskEngine } from "./lib/risk-engine";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Auto-run risk engine on startup to ensure fresh scores
  setImmediate(async () => {
    try {
      const result = await runRiskEngine();
      logger.info(result, "Startup risk engine run completed");
    } catch (err) {
      logger.error({ err }, "Startup risk engine run failed");
    }
  });
});
