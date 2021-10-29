
import articleTitle from 'article-title'
import fm from 'front-matter'
import got from 'got'

const getPropertyValue = prop => {
	if (prop) {
		return Array.isArray(prop) ? prop[0] : prop
	}
}

const itemsToArray = items => {
	return !items ? [] : (Array.isArray(items) ? items : [items])
}

const getPageTitle = async urlString => {
	try {
		const url = new URL(urlString)
		const res = await got(url)
		if (res) {
			return articleTitle(res.body)
		}
	} catch(err) {
		console.error('Could not parse:', urlString)
	}
}

export default {
	getPropertyValue: getPropertyValue,
	itemsToArray: itemsToArray,
	getPageTitle: getPageTitle,

	fromJSON: json => {
		if (!json || !json.type || !json.properties) {
			return null
		}
		const { type, properties } = json
		const category = itemsToArray(properties.category)
		return {
			'type': getPropertyValue(type),
			'content': getPropertyValue(properties.content),
			'name': getPropertyValue(properties.name),
			'category': category.length ? category : null,
			'photo': itemsToArray(properties.photo),
			'slug': getPropertyValue(properties['mp-slug']),
			'status': getPropertyValue(properties['post-status']),
			'visibility': getPropertyValue(properties['visibility']),
			'like-of': getPropertyValue(properties['like-of']),
			'bookmark-of': getPropertyValue(properties['bookmark-of']),
			'in-reply-to': getPropertyValue(properties['in-reply-to']),
			'rsvp': getPropertyValue(properties['rsvp']),
			'deleted': getPropertyValue(properties['deleted'])
		}
	},

	fromForm: form => {
		if  (!form || !form.h) {
			return null
		}
		const category = itemsToArray(form.category)
		return {
			'type': form.h ? `h-${form.h}` : null,
			'content': form.content,
			'name': form.name,
			'category': category.length ? category : null,
			'photo': [
				// photos could come in as either `photo` or `file`
				// handle `photo[]` and `file[]` for multiple files for now
				...itemsToArray(form.photo), ...itemsToArray(form.file),
				...itemsToArray(form['photo[]']), ...itemsToArray(form['file[]'])],
			'slug': form['mp-slug'],
			'status': form['post-status'],
			'visibility': form.visibility,
			'like-of': form['like-of'],
			'bookmark-of': form['bookmark-of'],
			'in-reply-to': form['in-reply-to'],
			'rsvp': form['rsvp'],
			'deleted': form['deleted']
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
			'like-of': attributes['like-of'],
			'bookmark-of': attributes['bookmark-of'],
			'in-reply-to': attributes['in-reply-to'],
			'rsvp': attributes['rsvp'],
			'deleted': attributes['deleted']
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
