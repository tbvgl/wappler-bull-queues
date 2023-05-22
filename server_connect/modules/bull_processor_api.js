const fs = require('fs-extra');
const App = require('../../../lib/core/app');
const { logMessage } = require("./advanced-logger");
const { global } = require('../../../lib/setup/config');
const { io } = require('../../../lib/server');
const bullLog = process.env.LOG_BULL_JOBS ? process.env.LOG_BULL_JOBS === "enabled" : false;
module.exports = async(job, done) => {
    try {

        const { action, jobData, headers, session} = job.data;

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
                `Running action ${action} with data: ${JSON.stringify(
                    jobData
                )}`
            );
        }

        try {

            const createMockRes = () => {
                return {
                    status(n) {
                        return this;
                    },
                    send(data) {
                    },
                    json(data) {
                    },
                    set(field, val) {
                    },
                };
            };
            const app = new App({
                method: `POST`,
                body: jobData,
                session: session,
                cookies: {},
                signedCookies: {},
                query: {},
                headers: headers,
              }, createMockRes());
            const actionFile = await fs.readJSON(`app/api/${action}.json`);

            await app.define(actionFile, true);

            await logMessage({
                message: `Job ${job.id} completed successfully`,
                log_level: "info",
            });

            if (bullLog) {
                await job.log(`Job ${job.id} completed successfully.`);
            }
            done();
        } catch (err) {
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
                        details: loggingError,
                        log_level: "error",
                    });
                }
            }

            done(err);
        }
    } catch (error) {
        console.error(`Error occurred while processing job: ${error.message}`);

        try {
            await logMessage({
                message: `Job ${job.id} failed with error: ${error.message}`,
                log_level: "error",
            });

            if (bullLog) {
                await job.log(`Job ${job.id} failed with error: ${error.message}`);
            }
        } catch (loggingError) {
            await logMessage({
                message: `Error occurred while logging job failure: ${loggingError.message}`,
                log_level: "error",
            });
        }

        done(error);
    }
};