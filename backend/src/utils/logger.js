const writeLine = (stream, message) => {
  stream.write(`${message}\n`);
};

const logger = {
  info(message) {
    writeLine(process.stdout, message);
  },
  error(message) {
    writeLine(process.stderr, message);
  },
};

module.exports = logger;
