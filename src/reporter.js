
export default function reporter (config, report) {
  const reporters = config.reporters || ['stdout']
  return Promise.all(reporters.map((e) => require(`./reporter/${e}-reporter`).default(config, report)))
}
