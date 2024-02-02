const fs = require("fs-extra");
const App = require("../../../lib/core/app");
const { logMessage } = require("./advanced-logger");
const { globals } = require("../../../lib/setup/config");
const bullLog = process.env.LOG_BULL_JOBS
  ? process.env.LOG_BULL_JOBS === "enabled"
  : false;

global.db = {};

module.exports = async (job, done) => {
  try {
    const { action, jobData, headers, session } = job.data;

    await logMessage({
      message: `Processing job ${job.id} with API: ${action}`,
      log_level: "debug",
    });

    if (bullLog) {
      await job.log(`Processing job ${job.id} with API: ${action}`);
    }

    await logMessage({
      message: `Running action ${action}`,
      details: jobData,
      log_level: "debug",
    });

    if (bullLog) {
      await job.log(
        `Running action ${action} with data: ${JSON.stringify(jobData)}`
      );
    }

    try {
      const createMockRes = () => {
        let responseStatusCode = 200;  // Default status code
        return {
          status(n) {
            responseStatusCode = n;
            return this;
          },
          send(data) {
            if (responseStatusCode >= 500) {
              throw new Error(`Triggered a ${responseStatusCode} response`);
            }
          },
          json(data) {
            if (responseStatusCode >= 500) {
              throw new Error(`Triggered a ${responseStatusCode} response`);
            }
          },
          set(field, val) {},
          getStatusCode: function() {
            return responseStatusCode;
          }
        };
      };

      let appBody = jobData;
      if (jobData.body) {
        appBody = { ...jobData, ...jobData.body };
        delete appBody.body;
      }

      const mockRes = createMockRes();

      headers["bull_job_id"] = job.id;
      appBody['bull_job_id'] = job.id;
      const app = new App(
        {
          method: `POST`,
          body: appBody,
          session: session,
          cookies: {},
          signedCookies: {},
          query: {},
          headers: headers,
        },
        mockRes
      );

      const actionFile = await fs.readJSON(`app/api/${action}.json`);
      await app.define(actionFile, true);

      if (mockRes.getStatusCode() >= 500) {
        throw new Error(`Triggered a ${mockRes.getStatusCode()} response`);
      }

      await logMessage({
        message: `Job ${job.id} completed successfully`,
        log_level: "info",
      });

      if (bullLog) {
        await job.log(`Job ${job.id} completed successfully.`);
      }

      // Closing DB connections
      for (const name in global.db) {
        if (global.db[name]) {
          try {
            await global.db[name].destroy();
          } catch (destroyError) {
            await logMessage({
              message: `Error closing DB connection ${name}: ${destroyError.message}`,
              log_level: "error",
            });
          } finally {
            delete global.db[name];
          }
          await logMessage({
            message: `DB Connection ${name} released`,
            log_level: "info",
          });
        }
      }

      done();
    } catch (err) {
      // Handle errors, including 500 responses
      await logMessage({
        message: `Job ${job.id} failed with error: ${err.message}`,
        details: err,
        log_level: "error",
      });

      if (bullLog) {
        try {
          await job.log(`Job ${job.id} failed with error: ${err.message}`);
        } catch (loggingError) {
          await logMessage({
            message: `Error occurred while logging job failure: ${loggingError.message}`,
            log_level: "error",
          });
        }
      }

      // Closing DB connections on error
      for (const name in global.db) {
        if (global.db[name]) {
          try {
            await global.db[name].destroy();
          } catch (destroyError) {
            await logMessage({
              message: `Error closing DB connection ${name}: ${destroyError.message}`,
              log_level: "error",
            });
          } finally {
            delete global.db[name];
          }
          await logMessage({
            message: `DB Connection ${name} released`,
            log_level: "info",
          });
        }
      }

      done(err);
    }
  } catch (error) {
    await logMessage({
      message: `Job ${job.id} failed with error: ${error.message}`,
      log_level: "error",
    });

    if (bullLog) {
      await job.log(`Job ${job.id} failed with error: ${error.message}`);
    }

    // Closing DB connections on catch block error
    for (const name in global.db) {
      if (global.db[name]) {
        try {
          await global.db[name].destroy();
        } catch (destroyError) {
          await logMessage({
            message: `Error closing DB connection ${name}: ${destroyError.message}`,
            log_level: "error",
          });
        } finally {
          delete global.db[name];
        }
        await logMessage({
          message: `DB Connection ${name} released`,
          log_level: "info",
        });
      }
    }
    done(error);
  }
};

module.exports.processJob = module.exports;
