---
layout: null
---
{% include_relative _search.js %}
{% include_relative _options.js %}

class Caniemail {

	constructor() {
		this.search = new Search();
		this.accessibleColors = new Options('.a11y-colors-button', 'accessible-colors-enabled');
		this.betaFeatures = new Options('.beta-features-button', 'beta-features-enabled');
	}
}

document.addEventListener("DOMContentLoaded", () => {
	window['caniemail'] = new Caniemail();
});