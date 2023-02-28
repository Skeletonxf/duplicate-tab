const IS_DEBUG = true
const logger = {}

if (IS_DEBUG) {
    logger.log = console.log.bind(console)
    logger.error = console.error.bind(console)
} else {
    logger.log = () => {}
    logger.error = () => {}
}

export default logger
