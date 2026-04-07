import express, { type Request, type Response } from "express";
import axios from "axios";
import bodyParser from "body-parser";

const { logFactory } = require("pretty-js-log");

const log = logFactory({ prefix: "webhook-reflector", useColors: true });
const LOG_ENABLED = process.env.LOG_OUTPUT !== "false";
const safeLog = {
  info: (...args: any[]) => {
    if (LOG_ENABLED) log.info(...args);
  },
  error: (...args: any[]) => {
    if (LOG_ENABLED) log.error(...args);
  },
  log: (...args: any[]) => {
    if (LOG_ENABLED) log(...args);
  },
};

const app = express();
const PORT = 3000;

const webhooks: string[] = process.env.WEBHOOKS?.split(",") || [];

const status: { [key: string]: string } = {};
app.use(bodyParser.json());

app.post("/webhook", async (req: Request, res: Response) => {
  safeLog.info("Received POST payload");

  for (const url of webhooks) {
    try {
      log(req.body, req.query, req.headers);
      await axios({
        method: "post",
        url,
        data: req.body,
        params: req.query,
        headers: {
          ...req.headers,
          host: undefined,
          "content-length": undefined,
        },
        validateStatus: () => true,
      });
      safeLog.log(`Sent to ${url}`);
      status[url] = "Sent";
    } catch (err: any) {
      const data = err.response?.data;
      const statusCode = err.response?.status;

      safeLog.error(`Failed to send to ${url}`, {
        status: statusCode,
        data,
      });

      status[url] = data || err.message;
    }
  }

  res.json({ message: "dispatched", status });
});

app.get("/webhook", async (req: Request, res: Response) => {
  safeLog.info("Received GET request");

  for (const url of webhooks) {
    try {
      await axios({
        method: "get",
        url,
        params: req.query,
        headers: {
          ...req.headers,
          host: undefined,
        },
        validateStatus: () => true,
      });

      safeLog.log(`Reflected GET to ${url}`);
      status[url] = "Sent";
    } catch (err: any) {
      const data = err.response?.data;
      const statusCode = err.response?.status;

      safeLog.error(`Failed to reflect GET to ${url}`, {
        status: statusCode,
        data,
      });

      status[url] = data || err.message;
    }
  }

  res.json({ message: "dispatched", status });
});

app.listen(PORT, () => {
  log(`Listening...`);
});
