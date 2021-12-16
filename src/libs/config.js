
const parseSyndicationTargets = (syndicateTo) => {
	let parsed
	if (syndicateTo) {
		try {
			parsed = JSON.parse(syndicateTo)
		} catch (err) {
			console.error('Could not parse syndication targets:', syndicateTo)
		}
	}
	if (parsed && (parsed.length || parsed.uid)) {
		return [].concat(parsed)
	}
}

export {
	parseSyndicationTargets
}
