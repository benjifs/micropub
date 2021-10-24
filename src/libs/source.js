
import GitHub from './github'
import parse from './parse'
import { utils } from './utils'

export default {
	get: async (url, properties) => {
		const filename = utils.urlToFilename(url)
		if (!filename) {
			return { 'error': 'invalid url' }
		}
		const exists = await GitHub.getFile(filename)
		if (!exists) {
			return { 'error': 'file does not exist' }
		}
		const parsed = parse.fromFrontMatter(exists.content)
		if (!parsed) {
			return { 'error': 'could not parse file' }
		}
		const source = parse.toSource(parsed)
		if (source && source.properties && properties) {
			source.properties = utils.pick(properties, source.properties)
		}
		return {
			'source': source
		}
	}
}
