// JavaScript Document
// Tobias Vogel - hello@tobi-vogel.com & Ken Truesdale - ken@uniqueideas.com

const { toSystemPath } = require("../../../lib/core/path");
const Queue = require("bull");
const config = require("../../../lib/setup/config");
const { logMessage } = require("./advanced-logger");
const ioredis = require("ioredis");

const defaultConcurrency = 5;
var redisReady = false;

if (process.env.REDIS_HOST || typeof global.redisClient !== "undefined") {
  redisReady = true;
}

function getRedisInstance(db) {
  return new ioredis({
    port:
      process.env.REDIS_PORT ||
      (global.redisClient ? global.redisClient.options.port : 6379),
    host:
      process.env.REDIS_HOST ||
      (global.redisClient
        ? global.redisClient.options.host
          ? global.redisClient.options.host
          : global.redisClient.options.socket.host
        : "localhost"),
    db: db || process.env.REDIS_BULL_QUEUE_DB || 2,
    password:
      process.env.REDIS_PASSWORD ||
      (global.redisClient ? global.redisClient.options.password : undefined),
    username:
      process.env.REDIS_USER ||
      (global.redisClient ? global.redisClient.options.user : undefined),
    tls:
      process.env.REDIS_TLS ||
      (global.redisClient ? global.redisClient.options.tls : undefined),
  });
}

const defaultQueueOptions = {
  redis: {
    port:
      process.env.REDIS_PORT ||
      (global.redisClient ? global.redisClient.options.port : 6379),
    host:
      process.env.REDIS_HOST ||
      (global.redisClient
        ? global.redisClient.options.host
          ? global.redisClient.options.host
          : global.redisClient.options.socket.host
        : "localhost"),
    db: process.env.REDIS_BULL_QUEUE_DB || 3,
    password:
      process.env.REDIS_PASSWORD ||
      (global.redisClient ? global.redisClient.options.password : undefined),
    username:
      process.env.REDIS_USER ||
      (global.redisClient ? global.redisClient.options.user : undefined),
    tls:
      process.env.REDIS_TLS ||
      (global.redisClient ? global.redisClient.options.tls : undefined),
    prefix: process.env.REDIS_PREFIX
      ? `{${process.env.REDIS_PREFIX}}`
      : undefined,
    metrics: process.env.REDIS_BULL_METRICS
      ? {
          maxDataPoints: process.env.REDIS_BULL_METRICS_TIME
            ? Queue.utils.MetricsTime[process.env.REDIS_BULL_METRICS_TIME]
            : Queue.utils.MetricsTime.TWO_WEEKS,
        }
      : undefined,
  },
};

var bullQueues = [];
var workerCounts = [];
var processorTypes = [];

const responseMessages = {
  noredis: { response: "No Redis connection." },
  noqueue: { response: "Queue does not exist." },
};

function setupQueue(queueName) {
  if (!bullQueues[queueName]) {
    bullQueues[queueName] = new Queue(queueName, defaultQueueOptions);
  }
}
const { processJob } = require("./bull_processor.js");
exports.create_queue = async function (options) {
  options = this.parse(options);
  if (!redisReady) {
    await logMessage({ message: "No Redis connection", log_level: "error" });
    return responseMessages.noredis;
  }

  let queueName = this.parseRequired(
    options.queue_name,
    "string",
    "Queue name is required"
  );

  let autostart;

  autostart = options.autoStart || false;

  if (autostart) {
    const redisInstance = getRedisInstance();
    await redisInstance.set(
      `autostartqueues:${queueName}`,
      JSON.stringify(options)
    );
  } else {
    const redisInstance = getRedisInstance();
    const key = `autostartqueues:${queueName}`;
    const exists = await redisInstance.exists(key);
    if (exists === 1) {
      await redisInstance.del(key);
    }
  }

  if (workerCounts[queueName]) {
    await logMessage({
      message: `Queue ${queueName} NOT created -- it already exists.`,
      log_level: "info",
    });
    return { response: `Queue ${queueName} NOT created -- it already exists.` };
  }

  let processor_type = "api";
  let processorPath = toSystemPath(
    "/extensions/server_connect/modules/bull_processor_sandboxed.js"
  );

  let concurrent_jobs = parseInt(
    this.parseOptional(options.concurrent_jobs, "*", defaultConcurrency)
  );
  concurrent_jobs = concurrent_jobs > 0 ? concurrent_jobs : defaultConcurrency;

  let queueOptions = defaultQueueOptions;
  if (
    this.parseOptional(options.limit_type, "*", "concurrency") === "limiter"
  ) {
    let max_jobs = parseInt(this.parseOptional(options.max_jobs, "*", null));
    let max_duration = parseInt(
      this.parseOptional(options.max_duration, "*", null)
    );
    if (max_duration && max_jobs) {
      queueOptions = {
        ...queueOptions,
        limiter: {
          max: max_jobs,
          duration: max_duration,
        },
      };
    }
  }

  await logMessage({
    message: "Creating Bull queue",
    log_level: "debug",
    details: { queueName, processor_type, concurrent_jobs, queueOptions },
  });

  bullQueues[queueName] = new Queue(queueName, queueOptions);
  processorTypes[queueName] = processor_type;
  workerCounts[queueName] = concurrent_jobs;
  if (options.same_thread) {
    bullQueues[queueName].process("*", concurrent_jobs, processJob);
  } else {
    bullQueues[queueName].process("*", concurrent_jobs, processorPath);
  }

  let jobscount = await bullQueues[queueName]
    .getJobCounts()
    .catch((error) =>
      logMessage({ message: error.message, log_level: "error" })
    );

  if (jobscount) {
    await logMessage({
      message: `Queue ${queueName} created`,
      log_level: "info",
    });
    return { response: `Queue ${queueName} created` };
  } else {
    await logMessage({
      message: `${queueName} NOT created`,
      log_level: "info",
    });
    return { response: `Queue ${queueName} NOT created` };
  }
};

exports.destroy_queue = async function (options) {
  await logMessage({ message: "Destroy queue start", log_level: "debug" });

  if (!redisReady) {
    await logMessage({ message: "No Redis connection", log_level: "error" });
    return responseMessages.noredis;
  }

  let queueName = this.parseRequired(
    options.queue_name,
    "string",
    "Queue name is required"
  );

  if (!bullQueues[queueName]) {
    await logMessage({
      message: `Queue object ${queueName} does not exist`,
      log_level: "info",
    });
    return { response: `Queue ${queueName} does not exist` };
  }

  await logMessage({
    message: `Obliterate and close the Bull queue for ${queueName}`,
    log_level: "debug",
  });

  try {
    await bullQueues[queueName].obliterate({ force: true });
    await bullQueues[queueName].close();
  } catch (error) {
    await logMessage({ message: error.message, log_level: "error" });
  }

  await logMessage({
    message: `Cleanup objects for queue ${queueName}`,
    log_level: "debug",
  });
  bullQueues[queueName] = null;
  processorTypes[queueName] = null;
  workerCounts[queueName] = null;

  await logMessage({
    message: `Queue ${queueName} destroyed.`,
    log_level: "info",
  });

  return { response: `Queue ${queueName} destroyed.` };
};

exports.queue_status = async function (options) {
  await logMessage({ message: "Queue status start", log_level: "debug" });

  if (redisReady) {
    await logMessage({ message: "Redis ready", log_level: "debug" });
    await logMessage({
      message: "Options",
      log_level: "debug",
      details: options,
    });

    let queueName = this.parseRequired(
      options.queue_name,
      "string",
      "Queue name is required"
    );

    setupQueue(queueName);

    if (bullQueues[queueName]) {
      await logMessage({
        message: "Queue: " + queueName + " exists, so get queue job counts",
        log_level: "debug",
      });

      let jobscount = await bullQueues[queueName]
        .getJobCounts()
        .catch((error) =>
          logMessage({ message: error.message, log_level: "error" })
        );
      let workers_attached = false;

      if (workerCounts[queueName]) {
        await logMessage({
          message: "Queue: " + queueName + " has workers attached",
          log_level: "debug",
        });
        workers_attached = true;
      } else {
        await logMessage({
          message: "Queue: " + queueName + " has no workers attached",
          log_level: "debug",
        });
      }

      await logMessage({
        message: "Queue: " + queueName + " status returned",
        log_level: "info",
      });
      await logMessage({
        message: "Queue: " + queueName + " status returned jobscounts",
        log_level: "debug",
        details: jobscount,
      });

      return {
        jobs_count: jobscount,
        queue: queueName,
        limiter: bullQueues[queueName].limiter || false,
        workers_attached: workers_attached,
        worker_count: workerCounts[queueName],
        worker_type: processorTypes[queueName],
      };
    } else {
      await logMessage({
        message: "Queue: " + queueName + " does not exist so nothing returned",
        log_level: "error",
      });
      return responseMessages["noqueue"];
    }
  } else {
    await logMessage({ message: "No Redis connection", log_level: "error" });
    await logMessage({ message: "Queue status finish", log_level: "debug" });
    return responseMessages.noredis;
  }
};

exports.queue_clean = async function (options) {
  await logMessage({ message: "Clean queue start", log_level: "debug" });

  if (redisReady) {
    await logMessage({ message: "Redis ready", log_level: "debug" });

    let queueName = this.parseRequired(
      options.queue_name,
      "string",
      "Queue name is required"
    );
    let job_status = this.parseOptional(options.job_status, "string", "");

    let grace_period = this.parseOptional(options.grace_period, "number", 0);

    if (bullQueues[queueName]) {
      await logMessage({
        message: `Queue: ${queueName} exists, so clean the queue`,
        log_level: "debug",
      });

      try {
        let cleaned = await bullQueues[queueName].clean(
          grace_period,
          job_status
        );

        await logMessage({
          message: `Queue: ${queueName} removed ${cleaned.length} jobs`,
          log_level: "info",
        });
        return { jobs_removed: cleaned.length };
      } catch (error) {
        await logMessage({ message: error.message, log_level: "error" });
      }
    } else {
      await logMessage({
        message: `Queue: ${queueName} does not exist so nothing returned`,
        log_level: "error",
      });
      return responseMessages["noqueue"];
    }
  } else {
    await logMessage({ message: "No Redis connection", log_level: "error" });
    return responseMessages.noredis;
  }
};

exports.queue_pause = async function (options) {
  await logMessage({
    message: "Pause queue start",
    log_level: "debug",
  });

  if (redisReady) {
    await logMessage({
      message: "Redis ready",
      log_level: "debug",
    });
    await logMessage({
      message: `Options: ${JSON.stringify(options)}`,
      log_level: "debug",
    });

    let queueName = this.parseRequired(
      options.queue_name,
      "string",
      "Queue name is required"
    );
    setupQueue(queueName);

    if (bullQueues[queueName]) {
      await logMessage({
        message: `Queue: ${queueName} exists, so pause the queue`,
        log_level: "debug",
      });

      let pauseQueue = await bullQueues[queueName]
        .pause({ isLocal: false, doNotWaitActive: true })
        .catch((err) =>
          logMessage({
            message: err.message,
            log_level: "error",
            details: err,
          })
        );

      await logMessage({
        message: `Queue: ${queueName} paused`,
        log_level: "info",
      });

      return { response: pauseQueue };
    } else {
      await logMessage({
        message: `Queue: ${queueName} does not exist so nothing returned`,
        log_level: "error",
      });
      return responseMessages["noqueue"];
    }
  } else {
    await logMessage({
      message: "No Redis connection",
      log_level: "error",
    });
    await logMessage({
      message: "Pause queue finish",
      log_level: "debug",
    });
    return responseMessages.noredis;
  }
};

exports.queue_resume = async function (options) {
  logMessage({ message: "Resume queue start", log_level: "debug" });

  if (redisReady) {
    let queueName = this.parseRequired(
      options.queue_name,
      "string",
      "Queue name is required"
    );
    setupQueue(queueName);

    if (bullQueues[queueName]) {
      logMessage({
        message: `Queue: ${queueName} exists, so resume the queue`,
        log_level: "debug",
      });

      try {
        let resumeQueue = await bullQueues[queueName].resume({
          isLocal: false,
        });
        logMessage({
          message: `Queue: ${queueName} resumed`,
          log_level: "info",
        });
        return { response: resumeQueue };
      } catch (error) {
        logMessage({
          message: `Failed to resume queue: ${queueName} with error: ${error.message}`,
          log_level: "error",
        });
      }
    } else {
      logMessage({
        message: `Queue: ${queueName} does not exist so nothing returned`,
        log_level: "error",
      });
      return responseMessages["noqueue"];
    }
  } else {
    logMessage({ message: "No Redis connection", log_level: "error" });
    logMessage({ message: "Resume queue finish", log_level: "debug" });
    return responseMessages.noredis;
  }
};

exports.get_jobs = async function (options) {
  await logMessage({ message: "Get jobs start", log_level: "debug" });

  if (redisReady) {
    await logMessage({ message: "Redis ready", log_level: "debug" });
    await logMessage({
      message: `Options: ${JSON.stringify(options)}`,
      log_level: "debug",
    });

    let queueName = this.parseRequired(
      options.queue_name,
      "string",
      "Queue name is required"
    );

    setupQueue(queueName);

    if (bullQueues[queueName]) {
      await logMessage({
        message: `Queue: ${queueName} exists, so get the jobs`,
        log_level: "debug",
      });

      let job_status = this.parseRequired(
        options.job_status,
        "string",
        "Parameter job_status is required."
      );

      let jobs = null;
      await logMessage({
        message: `Getting jobs that have status: ${job_status}`,
        log_level: "debug",
      });

      try {
        switch (job_status) {
          case "failed":
            jobs = await bullQueues[queueName].getFailed();
            break;
          case "completed":
            jobs = await bullQueues[queueName].getCompleted();
            break;
          case "delayed":
            jobs = await bullQueues[queueName].getDelayed();
            break;
          case "waiting":
            jobs = await bullQueues[queueName].getWaiting();
            break;
          case "active":
            jobs = await bullQueues[queueName].getActive();
            break;
          default:
          // code block
        }
      } catch (error) {
        await logMessage({
          message: error.message,
          log_level: "error",
        });
      }

      await logMessage({
        message: `Returned ${jobs.length} jobs`,
        log_level: "info",
      });

      return { jobs: jobs };
    } else {
      await logMessage({
        message: `Queue: ${queueName} does not exist so nothing returned`,
        log_level: "error",
      });

      return responseMessages["noqueue"];
    }
  } else {
    await logMessage({ message: "No Redis connection", log_level: "error" });
    await logMessage({ message: "Get jobs finish", log_level: "debug" });

    return responseMessages.noredis;
  }
};

exports.retry_job = async function (options) {
  await logMessage({ message: "Retry job start", log_level: "debug" });

  if (redisReady) {
    let queueName = this.parseRequired(
      options.queue_name,
      "string",
      "Queue name is required"
    );

    setupQueue(queueName);

    if (bullQueues[queueName]) {
      let job_id = this.parseRequired(
        options.job_id,
        "number",
        "parameter job id is required."
      );

      await logMessage({
        message: `Queue: ${queueName} exists, so retry jobID: ${job_id}`,
        log_level: "debug",
      });

      let job = await bullQueues[queueName].getJob(job_id);

      if (job) {
        try {
          job_state = await job.retry();
        } catch (err) {
          await logMessage({
            message: `JobID ${job_id}: ${err.message}`,
            log_level: "warn",
          });
          return { response: err.message };
        }

        await logMessage({
          message: `JobID ${job_id} queued for retry`,
          log_level: "info",
        });
        return { response: "queued for retry" };
      } else {
        await logMessage({
          message: `JobID ${job_id} not found`,
          log_level: "warn",
        });
        job_state = "Job not found";
        return { response: job_state };
      }
    } else {
      await logMessage({
        message: `Queue: ${queueName} does not exist so nothing returned`,
        log_level: "error",
      });
      return responseMessages["noqueue"];
    }
  } else {
    await logMessage({ message: "No Redis connection", log_level: "error" });
    await logMessage({ message: "Create queue finish", log_level: "debug" });
    return responseMessages.noredis;
  }
};

exports.job_state = async function (options) {
  await logMessage({
    message: "Job state start",
    log_level: "debug",
  });

  if (redisReady) {
    await logMessage({
      message: "Redis ready",
      log_level: "debug",
    });
    await logMessage({
      message: "Options",
      log_level: "debug",
      details: options,
    });

    let queueName = this.parseRequired(
      options.queue_name,
      "string",
      "Queue name is required"
    );

    setupQueue(queueName);

    if (bullQueues[queueName]) {
      let job_id = this.parseRequired(
        options.job_id,
        "string",
        "parameter job id is required."
      );
      await logMessage({
        message: `Queue: ${queueName} exists, so get job state of jobID: ${job_id}`,
        log_level: "debug",
      });

      let job = await jobState.getJob(job_id);

      let job_state;

      if (job) {
        await logMessage({
          message: `Returned job state for jobID: ${job_id}`,
          log_level: "info",
        });
        job_state = await job.getState();
      } else {
        await logMessage({
          message: `JobID ${job_id} not found`,
          log_level: "warn",
        });
        job_state = "Job not found";
      }

      return { job: job, job_state: job_state };
    } else {
      await logMessage({
        message: `Queue: ${queueName} does not exist so nothing returned`,
        log_level: "error",
      });
      return responseMessages["noqueue"];
    }
  } else {
    await logMessage({
      message: "No Redis connection",
      log_level: "error",
    });
    await logMessage({
      message: "Create queue finish",
      log_level: "debug",
    });
    return responseMessages.noredis;
  }
};

exports.add_job_api = async function (options) {
  await logMessage({
    message: "Add job api start",
    log_level: "debug",
  });

  if (redisReady) {
    await logMessage({
      message: "Redis ready",
      log_level: "debug",
    });
    await logMessage({
      message: "Options",
      log_level: "debug",
      details: options,
    });

    let queueName = this.parseRequired(
      options.queue_name,
      "string",
      "Queue name is required"
    );
    let remove_on_complete;

    remove_on_complete = this.parseOptional(
      options.remove_on_complete,
      "boolean"
    );

    const keep_completed_jobs = this.parseOptional(
      options.keep_completed_jobs,
      "number",
      null
    );

    if (keep_completed_jobs !== null) {
      remove_on_complete = keep_completed_jobs;
    }

    let remove_on_fail;

    remove_on_fail = this.parseOptional(options.remove_on_fail, "boolean");

    const keep_failed_jobs = this.parseOptional(
      options.keep_failed_jobs,
      "number",
      null
    );

    if (keep_failed_jobs !== null) {
      remove_on_fail = keep_failed_jobs;
    }

    let attempts = parseInt(this.parseOptional(options.attempts, "*", 1));
    if (attempts <= 0) {
      throw new Error("The number of attempts must be a positive integer.");
    }

    let attempts_delay = parseInt(
      this.parseOptional(options.attempts_delay, "*", 0)
    );
    if (attempts_delay < 0) {
      throw new Error(
        "The delay between attempts must be a non-negative integer."
      );
    }

    let backoff_type = this.parseOptional(
      options.backoff_type,
      "string",
      "fixed"
    );
    if (backoff_type !== "fixed" && backoff_type !== "exponential") {
      throw new Error(
        "The backoff type must be either 'fixed' or 'exponential'."
      );
    }

    let priority = parseInt(this.parseOptional(options.priority, "number"));
    let repeat = this.parseOptional(options.repeatable, "boolean", false);

    let repeat_every = this.parseOptional(
      options.repeat_interval,
      "number",
      null
    );
    if (repeat_every !== null && repeat_every <= 0) {
      throw new Error("The repeat interval must be a positive integer.");
    }

    let repeat_limit = this.parseOptional(options.repeat_limit, "number", null);
    if (repeat_limit !== null && repeat_limit <= 0) {
      throw new Error("The repeat limit must be a positive integer.");
    }

    let repeat_pattern = this.parseOptional(
      options.repeat_pattern,
      "string",
      null
    );
    if (repeat_pattern !== null && !isValidCron(repeat_pattern)) {
      throw new Error("The repeat pattern must be a valid cron pattern.");
    }

    let jobName = this.parseOptional(options.repeat_job_name, "string", null);

    setupQueue(queueName);

    if (bullQueues[queueName]) {
      let apiFile = this.parseRequired(
        options.api_file,
        "string",
        "parameter api_file is required."
      );
      let delay_ms = parseInt(this.parseOptional(options.delay_ms, "*", 0));
      let serverName =
        (this.global.data.$_SERVER && this.global.data.$_SERVER.SERVER_NAME) ||
        "localhost";

      let base_url =
        this.global.data.$_SERVER.REQUEST_PROTOCOL +
        "://" +
        serverName +
        "/api/";

      if (serverName.includes("localhost")) {
        base_url = "http://localhost:" + config.port + "/api/";
      }

      try {
        var myRegexp = /(?<=api\/).*/;
        var apiName = myRegexp.exec(apiFile)[0].replace(".json", "");
      } catch (error) {
        await logMessage({
          message:
            "Attempt to use processing file from outside this project's app/api folder",
          log_level: "error",
          details: error,
        });
        return {
          error:
            "You must select a file from this project's app/api folder (or its children)",
        };
      }

      var jobData = this.parse(options.bindings) || {};

      // If a job name is provided, add it to the job data

      if (processorTypes[queueName] == "api" || !workerCounts[queueName]) {
        await logMessage({
          message: "Add job to queue",
          log_level: "debug",
          //details: bullQueues[queueName],
        });

        let jobOptions = {
          delay: delay_ms,
          removeOnComplete: remove_on_complete,
          removeOnFail: remove_on_fail,
          attempts: attempts,
        };

        if (attempts > 1) {
          jobOptions.backoff = {
            type: backoff_type,
            delay: attempts_delay,
          };
        }

        if (priority !== null) {
          jobOptions.priority = priority;
        }

        let repeatOptions = {};
        if (repeat) {
          if (repeat_every) repeatOptions.every = repeat_every;
          if (repeat_limit) repeatOptions.limit = repeat_limit;
          if (repeat_pattern) repeatOptions.cron = repeat_pattern;
        }

        if (Object.keys(repeatOptions).length !== 0) {
          jobOptions.repeat = repeatOptions;
        }
        let session = this.req.session;

        let headers = this.req.headers;

        let forward_post = this.parseOptional(
          options.forward_post,
          "boolean",
          false
        );

        let jobPayload = {
          jobData: jobData,
          action: apiName,
          baseURL: base_url,
          headers: headers,
          session: session,
        };

        if (forward_post) {
          jobData.body = this.req.body;
        }

        if (jobName) {
          jobPayload = { ...jobPayload, name: jobName };
        }

        try {
          const job = jobName
            ? await bullQueues[queueName].add(jobName, jobPayload, jobOptions)
            : await bullQueues[queueName].add(jobPayload, jobOptions);

          await logMessage({
            message: "Job submitted to queue",
            log_level: "info",
            details: { queue: queueName, JobID: job.id },
          });

          return { job_id: job.id, queue: queueName };
        } catch (error) {
          await logMessage({
            message: "Add job to queue failed",
            log_level: "error",
            details: error,
          });
          throw error;
        }
      } else {
        await logMessage({
          message: "Queue is not setup for API processing.",
          log_level: "warn",
          details: queueName,
        });
        return {
          response: "Queue " + queueName + " is not setup for API processing.",
        };
      }
    } else {
      await logMessage({
        message: `Queue: ${queueName} does not exist so nothing returned`,
        log_level: "error",
      });
      return responseMessages["noqueue"];
    }
  } else {
    await logMessage({
      message: "No Redis connection",
      log_level: "error",
    });
    await logMessage({
      message: "Create queue finish",
      log_level: "debug",
    });
    return responseMessages.noredis;
  }
};

exports.get_repeatable_jobs = async function (options) {
  await logMessage({
    message: "Get repeatable jobs start",
    log_level: "debug",
  });

  if (redisReady) {
    await logMessage({ message: "Redis ready", log_level: "debug" });
    await logMessage({
      message: `Options: ${JSON.stringify(options)}`,
      log_level: "debug",
    });

    let queueName = this.parseRequired(
      options.queue_name,
      "string",
      "Queue name is required"
    );

    setupQueue(queueName);

    if (bullQueues[queueName]) {
      await logMessage({
        message: `Queue: ${queueName} exists, so get the jobs`,
        log_level: "debug",
      });

      let jobs = null;
      await logMessage({
        message: `Getting repeatable jobs`,
        log_level: "debug",
      });

      try {
        jobs = await bullQueues[queueName].getRepeatableJobs();
      } catch (error) {
        await logMessage({
          message: error.message,
          log_level: "error",
        });
      }

      await logMessage({
        message: `Returned ${jobs.length} jobs`,
        log_level: "info",
      });

      return { jobs: jobs };
    } else {
      await logMessage({
        message: `Queue: ${queueName} does not exist so nothing returned`,
        log_level: "error",
      });

      return responseMessages["noqueue"];
    }
  } else {
    await logMessage({ message: "No Redis connection", log_level: "error" });
    await logMessage({
      message: "Get repeatable jobs finish",
      log_level: "debug",
    });

    return responseMessages.noredis;
  }
};

function isValidCron(cron) {
  try {
    new CronJob(cron);
    return true;
  } catch (e) {
    return false;
  }
}

exports.remove_repeatable_job = async function (options) {
  await logMessage({
    message: "Remove repeatable job start",
    log_level: "debug",
  });

  if (redisReady) {
    await logMessage({ message: "Redis ready", log_level: "debug" });
    await logMessage({
      message: `Options`,
      details: options,
      log_level: "debug",
    });

    let queueName = this.parseRequired(
      options.queue_name,
      "string",
      "Queue name is required"
    );

    let jobName = this.parseRequired(
      options.job_name,
      "string",
      "Job name is required"
    );

    setupQueue(queueName);

    if (bullQueues[queueName]) {
      await logMessage({
        message: `Queue: ${queueName} exists, removing job: ${jobName}`,
        log_level: "debug",
      });

      let repeatableJobs = await bullQueues[queueName].getRepeatableJobs();
      let job = repeatableJobs.find((job) => job.name === jobName);

      if (job) {
        try {
          await bullQueues[queueName].removeRepeatableByKey(job.key);
          await logMessage({
            message: `Job: ${jobName} successfully removed`,
            log_level: "info",
          });

          return { success: true };
        } catch (error) {
          await logMessage({
            message: error.message,
            log_level: "error",
          });

          return { success: false, error: error.message };
        }
      } else {
        await logMessage({
          message: `Job: ${jobName} does not exist`,
          log_level: "error",
        });

        return { success: false, error: `Job: ${jobName} does not exist` };
      }
    } else {
      await logMessage({
        message: `Queue: ${queueName} does not exist`,
        log_level: "error",
      });

      return responseMessages["noqueue"];
    }
  } else {
    await logMessage({ message: "No Redis connection", log_level: "error" });
    await logMessage({
      message: "Remove repeatable job finish",
      log_level: "debug",
    });

    return responseMessages.noredis;
  }
};

exports.remove_job = async function (options) {
  await logMessage({
    message: "Remove job start",
    log_level: "debug",
  });

  if (redisReady) {
    await logMessage({ message: "Redis ready", log_level: "debug" });
    await logMessage({
      message: `Options`,
      details: options,
      log_level: "debug",
    });

    let queueName = this.parseRequired(
      options.queue_name,
      "string",
      "Queue name is required"
    );

    let jobId = this.parseRequired(
      String(options.job_id),
      "string",
      "Job id is required"
    );

    setupQueue(queueName);

    if (bullQueues[queueName]) {
      await logMessage({
        message: `Queue: ${queueName} exists, removing job: ${jobId}`,
        log_level: "debug",
      });

      let job = await bullQueues[queueName].getJob(jobId);

      if (job) {
        try {
          await job.remove();
          await logMessage({
            message: `Job: ${jobId} successfully removed`,
            log_level: "info",
          });

          return { success: true };
        } catch (error) {
          await logMessage({
            message: error.message,
            log_level: "error",
          });

          return { success: false, error: error.message };
        }
      } else {
        await logMessage({
          message: `Job: ${jobId} does not exist`,
          log_level: "error",
        });

        return { success: false, error: `Job: ${jobId} does not exist` };
      }
    } else {
      await logMessage({
        message: `Queue: ${queueName} does not exist`,
        log_level: "error",
      });

      return responseMessages["noqueue"];
    }
  } else {
    await logMessage({ message: "No Redis connection", log_level: "error" });
    await logMessage({
      message: "Remove job finish",
      log_level: "debug",
    });

    return responseMessages.noredis;
  }
};

exports.list_autostart_queues = async function () {
  const redis = getRedisInstance();
  let queues = [];

  try {
    const queueKeys = await redis.keys("autostartqueues:*");
    if (queueKeys.length) {
      for (let queueKey of queueKeys) {
        const optionsString = await redis.get(queueKey);
        if (optionsString) {
          const options = JSON.parse(optionsString);
          queues.push({
            queueName: queueKey.replace("autostartqueues:", ""),
            options: options,
          });
        }
      }
    }
    await logMessage({
      message: "Successfully listed all autostart queues",
      log_level: "info",
      details: queues,
    });
  } catch (error) {
    await logMessage({
      message: `Failed to list autostart queues: ${error.message}`,
      log_level: "error",
    });
  }

  return queues;
};

exports.remove_autostart_queue = async function (options) {
  const redis = getRedisInstance();
  let queueName = this.parseRequired(
    options.queueName,
    "string",
    "Queue name is required"
  );

  try {
    const key = `autostartqueues:${queueName}`;
    const exists = await redis.exists(key);
    if (exists === 0) {
      await logMessage({
        message: `Queue ${queueName} does not exist.`,
        log_level: "warn",
        details: { queueName },
      });
      return;
    }
    await redis.del(key);

    await logMessage({
      message: `Successfully removed autostart queue ${queueName}`,
      log_level: "info",
      details: { queueName },
    });
  } catch (error) {
    await logMessage({
      message: `Failed to remove autostart queue ${queueName}: ${error.message}`,
      log_level: "error",
    });
  }
};
