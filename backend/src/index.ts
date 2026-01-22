import { createApp } from "./app.js";
import { config } from "./config.js";
import "dotenv/config";

const app = createApp();

app.listen(config.port, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${config.port}`);
});
