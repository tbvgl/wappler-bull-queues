# Wappler Bull Queues

## Functionality
Allows for the creation of one to many queues to offload the execution of Wappler library tasks

## Requirements
* Functioning Redis connection, specified within the Wappler server config or a Redis connection defined with ENV variables

## Installation
* In your project folder, create /extensions/server_connect/modules (if it does not yet exist)
* Unzip the source code into /extensions/server_connect/modules (5 files)
* Refresh the Server Actions panel (restarting Wappler is also an option)
* The required libraries will be installed automatically upon use and next deployment
* You should now have a Bull Queues group in your available actions list for server workflows

## Optional ENV Variables
* REDIS_PORT: The Redis port
* REDIS_HOST: The Redis host
* REDIS_BULL_QUEUE_DB: The Redis database for bull queues
* REDIS_PASSWORD: The Redis password
* REDIS_USER: The Redis user
* REDIS_TLS: The TLS certificate. Define it is {} if you need a TLS connection without defining a cert.
* REDIS_PREFIX: The prefix for the database. This is useful if you need to connect to a clusert.
* REDIS_BULL_METRICS: Boolean. Enables Bull metrics collection which can be visualised with a GUI like https://taskforce.sh/
* REDIS_BULL_METRICS_TIME: The timeframe for metric collection. Defaults to TWO_WEEKS if metrics are enabled

## Logging

Logging is handled by https://github.com/tbvgl/wappler-advanced-logger. 
Please see the readme in the advanced logger repo for more details.
The advanced logger will be automatically installed in your project if you install wappler bull queues via npm.

## Actions
### Create Queue
* Creates a queue with optional parameters.
* Responds with a message indicating the result.
* Features autostarting of queues.

Queue Parameters:
* **Queue name** - Used to specify a unique queue. This is also used by actions to specify the queue.
* **Number of concurrent jobs** - The number of jobs that can run in parallel for this queue.
* **Max jobs** - The maximum number of jobs to be run within a given duration.
* **Duration for max jobs** - Number of milliseconds used when calculating max jobs.
* By default, the parameters are set to 5 concurrent jobs, and no rate limiting (no max jobs, and no duration).

#### Rate limiting
By using the max jobs and duration parameters for a queue, a queue can limit how quickly jobs are processed.  For example, if the library uses an external API that limits usage to 1 request per second, the queue can be configured with Max jobs = 1, and Duration = 1000 milliseconds.

#### Autostarting Queues
If a queue is configured to autostart, it will automatically start when the application starts. This feature allows the queue to begin processing jobs without manual intervention, improving efficiency and streamlining the job processing flow.


### Add Job
* Add a job into a queue to execute the specified API file, with the ability to pass along headers and sessions for use inside API jobs. This adds compatibility with Wappler's security provider and it allows you to access `$_SESSION` and `$_SERVER` in your job actions. 
* Job additions come with a range of configurable options:
  * **Create Queue with Defaults** - Optionally create a queue with the default set of parameters.
  * **Job Delay** - Define a delay for the job, specified in milliseconds.
  * **Job Removal Upon Completion or Failure** - Decide whether to remove the job from the queue upon its completion or failure.
  * **Retention of Completed Jobs** - Specify the number of completed jobs to retain in the queue, which is useful for tracking and analyzing job execution success.
  * **Retention of Failed Jobs** - Specify the number of failed jobs to retain in the queue, which aids in diagnosing failure causes and improving error handling.
  * **Job Repetition** - Add jobs that should repeat according to a defined schedule or interval.
  * **Job Priority** - Assign a priority level to jobs, with lower numbers indicating higher priority. The default value is `null` (no specific priority).
  * **Backoff Strategy** - Define the frequency and method (either exponential or fixed) of job retry attempts following failure.
* The job addition will respond with the corresponding job ID.

### Remove Repeatable Job
* Deletes a repeatable job from the queue.

### Get Repeated Jobs
* Fetches a list of all repeatable jobs currently in the queue.

### List Autostart Queues
* Provides a list of all queues currently configured to automatically start when the application initiates and their settings.

### Remove Autostart Queues
* Removes specified queues from the autostart configuration, preventing them from automatically starting when the application initiates.
### Retry job
Allows resubmitting a job for processing via job id

### Queue Status
* Returns the job counts for the specified queue (Active, completed, waiting, delayed, etc.)

### Queue Clean
* Removes jobs from a queue by job status
* Optionally set grace period to retain newer jobs while deleting old
* Job status choices: Completed, Delayed, Failed (Active jobs cannot be removed, Waiting not support by Bull queue library)

### Job State
* Returns the job details for a given job id, along with the current status

### Get Jobs
* Retrieve jobs by job status from a specified queue
* Job choices: Active, Failed, Waiting, Delayed, Completed

### Destroy Queue
* Forecably destroys a given queue
* Removes any and all jobs from the queue (any jobs currently running will complete)
* Resets the job id back to 1


