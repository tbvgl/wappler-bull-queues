const App = require("../../../lib/core/app");
const ioredis = require("ioredis");
const bullQueuesModule = require("../modules/bull_queues");
const { logMessage } = require("../modules/advanced-logger");

function getRedisInstance() {
    return new ioredis({
        port: process.env.REDIS_PORT || (global.redisClient ? global.redisClient.options.port : 6379),
        host: process.env.REDIS_HOST ||
            (global.redisClient ?
                (global.redisClient.options.host ?
                    global.redisClient.options.host :
                    global.redisClient.options.socket.host) :
                "localhost"),
        db: process.env.REDIS_BULL_QUEUE_DB || 3,
        password: process.env.REDIS_PASSWORD || (global.redisClient ? global.redisClient.options.password : undefined),
        username: process.env.REDIS_USER || (global.redisClient ? global.redisClient.options.user : undefined),
        tls: process.env.REDIS_TLS || (global.redisClient ? global.redisClient.options.tls : undefined),
    });
}


const startQueues = async() => {
    const redis = getRedisInstance();
    const appInstance = new App();

    try {
        const queueKeys = await redis.keys("autostartqueues:*");
        if (queueKeys.length) {
            for (let queueKey of queueKeys) {
                const optionsString = await redis.get(queueKey);
                if (optionsString) {
                    const options = JSON.parse(optionsString);
                    await bullQueuesModule.create_queue.bind(appInstance)(options);
                }
            }
            await logMessage({
                message: "Queues successfully initialized on server start",
                log_level: "info",
            });
        }
    } catch (error) {
        await logMessage({
            message: `Failed to initialize queues on server start: ${error.message}`,
            log_level: "error",
            details: error,
        });
    }
};

exports.after = startQueues;