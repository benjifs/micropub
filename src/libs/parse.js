
import articleTitle from 'article-title'
import matter from 'gray-matter'
import got from 'got'
import { utils } from './utils'

const getPropertyValue = prop => Array.isArray(prop) ? prop[0] : prop

const itemsToArray = items => !items ? [] : (Array.isArray(items) ? items : [items])

const getPageTitle = async urlString => {
	try {
		const url = new URL(urlString)
		const res = await got(url)
		return res && res.body ? articleTitle(res.body) : null
	} catch(err) {
		console.error('Could not parse:', urlString)
	}
}

// Properties that should be renamed to keep a consistent structure
const renameProperties = {
	'title': 'name',
	'tags': 'category'
}

export default {
	getPropertyValue: getPropertyValue,
	itemsToArray: itemsToArray,
	getPageTitle: getPageTitle,

	fromJSON: json => {
		if (!json || !json.type || !json.properties) {
			return null
		}
		const parsed = {}
		for (let [key, value] of Object.entries(json)) {
			if (key == 'properties') {
				for (let [propKey, propValue] of Object.entries(value)) {
					if (renameProperties[propKey]) {
						propKey = renameProperties[propKey]
					} else if (propKey.startsWith('mp-')) {
						propKey = propKey.slice(3)
					}
					if (['category', 'syndicate-to'].includes(propKey)) {
						parsed[propKey] = itemsToArray(propValue)
					} else {
						parsed[propKey] = getPropertyValue(propValue)
					}
				}
			} else {
				parsed[key] = getPropertyValue(value)
			}
		}
		return utils.removeEmpty(parsed)
	},

	fromForm: form => {
		if  (!form || !form.h) {
			return null
		}
		const parsed = {}
		for (let [key, value] of Object.entries(form)) {
			if (key == 'h') {
				parsed['type'] = `h-${value}`
			} else if (!parsed['photo'] && ['photo', 'file', 'photo[]', 'file[]'].includes(key)) {
				parsed['photo'] = [
					// photos could come in as either `photo` or `file`
					// handle `photo[]` and `file[]` for multiple files for now
					...itemsToArray(form.photo), ...itemsToArray(form.file),
					...itemsToArray(form['photo[]']), ...itemsToArray(form['file[]'])]
			} else if (key.startsWith('mp-')) {
				key = key.slice(3)
				parsed[key] = value
			} else if (key == 'category') {
				parsed[key] = itemsToArray(value)
			} else {
				parsed[key] = value
			}
		}
		return utils.removeEmpty(parsed)
	},

	fromFrontMatter: data => {
		const fm = matter(data.toString())
		const attributes = fm.data
		const parsed = {}

		for (let [key, value] of Object.entries(attributes)) {
			if (renameProperties[key]) {
				parsed[renameProperties[key]] = value
			} else if (['date', 'updated'].includes(key)) {
				parsed[key] = value.toISOString()
			} else if (['draft'].includes(key)) {
				parsed['status'] = key
			} else {
				parsed[key] = value
			}
		}
		parsed['type'] = parsed['type'] || 'h-entry'
		parsed['content'] = fm.content.trim()

		return utils.removeEmpty(parsed)
	},

	toSource: data => {
		return {
			'type': data.type,
			'properties': {
				'name': data.name ? [data.name] : null,
				'summary': data.summary ? [data.summary] : null,
				'content': [data.content],
				'published': [data.date],
				'updated': [data.updated],
				'category': data.category
			}
		}
	}
}
