
import fm from 'front-matter'

const stringFromProp = prop => {
	if (prop) {
		return Array.isArray(prop) ? prop[0] : prop
	}
}

const itemsToArray = items => {
	return !items ? [] : (Array.isArray(items) ? items : [items])
}

export default {
	stringFromProp: stringFromProp,
	itemsToArray: itemsToArray,

	fromJSON: json => {
		if (!json || !json.type || !json.properties) {
			return null
		}
		const { type, properties } = json
		return {
			'type': stringFromProp(type),
			'content': stringFromProp(properties.content),
			'name': stringFromProp(properties.name),
			'category': itemsToArray(properties.category),
			'photo': itemsToArray(properties.photo),
			'slug': stringFromProp(properties['mp-slug']),
			'status': stringFromProp(properties['post-status']),
			'visibility': stringFromProp(properties['visibility'])
		}
	},

	fromForm: form => {
		if  (!form || !form.h) {
			return null
		}
		return {
			'type': form.h ? `h-${form.h}` : null,
			'content': form.content,
			'name': form.name,
			'category': itemsToArray(form.category),
			'photo': [
				// photos could come in as either `photo` or `file`
				// handle `photo[]` and `file[]` for multiple files for now
				...itemsToArray(form.photo), ...itemsToArray(form.file),
				...itemsToArray(form['photo[]']), ...itemsToArray(form['file[]'])],
			'slug': form['mp-slug'],
			'status': form['post-status'],
			'visibility': form.visibility
		}
	},

	fromFrontMatter: data => {
		const { attributes, body } = fm(data.toString())
		return {
			'type': attributes.type || 'h-entry',
			'content': body,
			'name': attributes.title,
			'category': attributes.tags,
			'date': attributes.date.toISOString(),
			'updated': attributes.updated ? attributes.updated.toISOString : null,
			'status': attributes.draft ? 'draft' : null,
			'deleted': attributes.deleted
		}
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
