
import GitHub from './github'
import content from './content'
import { utils } from './utils'

const parsedToSource = (parsed, properties) => {
	const source = {
		'type': parsed.type,
		'properties': {
			'name': parsed.title,
			'summary': parsed.summary,
			'content': [parsed.content],
			'published': [parsed.date],
			'updated': [parsed.updated],
			'category': parsed.tags
		}
	}
	if (properties) {
		delete source.type
		for (let key in source.properties) {
			if (!properties.includes(key)) {
				delete source.properties[key]
			}
		}
	}
	return source
}

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
		const parsed = content.parse(exists.content)
		if (!parsed) {
			return { 'error': 'could not parse file' }
		}
		return {
			'source': parsedToSource(parsed, properties)
		}
	}
}
