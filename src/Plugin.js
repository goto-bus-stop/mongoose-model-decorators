export const pluginsSymbol = Symbol('plugins')

export default function Plugin (plugin, param) {
  return (Class) => {
    Class[pluginsSymbol] = Class[pluginsSymbol] || []
    Class[pluginsSymbol].push({ plugin, param })
    return Class
  }
}
