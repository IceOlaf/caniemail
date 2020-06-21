---
layout: null
permalink: "/assets/js/compare.js"
---
class Compare {

	constructor() {
		this.data = null;
		this.nicenames = null;
		this.resultsContainer = null;
		this.panel = document.querySelector('.compare');
		this.form = document.getElementById('compare-form');

		if(this.panel && this.form) {
			this.init();
		}
	}

	init() {

		this.setInitialValues();
		this.addEventToResetButton();
		this.addEventToCheckboxes();

		if(!this.data) {
			this.loadJSONFile();
		}
	}

	setInitialValues() {

		const savedValuesString = this.getLocalStorage();
		if(savedValuesString && savedValuesString !== '') {
			const savedValues = savedValuesString.split('&');
			if(savedValues.length > 0) {
				savedValues.forEach(setting => {
					const keyValuePair = setting.split('=');
					const key = keyValuePair[0];
					const value = keyValuePair[1];
					if(value.toLowerCase() == 'on') {
						const checkbox = this.panel.querySelector(`input[type="checkbox"][name="${key}"]`);
						checkbox.checked = true;
					} else {
						const checkbox = this.panel.querySelector(`input[type="checkbox"][name="${key}"][value="${value}"]`);
						checkbox.checked = true;
					}
				});
			}
			// Indeterminate status
			const uncheckedParentCheckboxes = this.panel.querySelectorAll('.compare-list-item > input[type="checkbox"]:not(:checked)');
			if(uncheckedParentCheckboxes.length > 0) {
				uncheckedParentCheckboxes.forEach(checkbox => {
					const checkedChildrenCheckboxes = checkbox.parentNode.querySelectorAll('.compare-child-list-item input[type="checkbox"]:checked');
					if(checkedChildrenCheckboxes.length > 0) {
						checkbox.indeterminate = true;
					}
				});
			}
			// Toggle button default state
			if(savedValues.length == this.panel.querySelectorAll('input[type="checkbox"]').length) {
				let button = this.panel.querySelector('#compare-check-all-button');
				const dataAttributeChecked = 'data-checked';
				button.setAttribute(dataAttributeChecked, false);
				// Change label
				const dataAttributeLabel = 'data-label-toggle';
				const oldLabel = button.innerText;
				const newLabel = button.getAttribute(dataAttributeLabel);
				button.innerText = newLabel;
				button.setAttribute(dataAttributeLabel, oldLabel);
			}
		} else {
			const checkboxes = this.panel.querySelectorAll('input[type="checkbox"]');
			checkboxes.forEach(checkbox => {
				checkbox.checked = false;
			});
		}
	}

	addEventToCheckboxes() {

		const checkboxes = this.panel.querySelectorAll('input[type="checkbox"]');
		checkboxes.forEach(checkbox => {
			checkbox.addEventListener('click', e => {
				if(checkbox.parentNode.className == 'compare-list-item') {
					const childCheckboxes = checkbox.parentNode.querySelectorAll('.compare-child-list-item input[type="checkbox"]');
					if(childCheckboxes.length > 0) {
						const checkboxStatus = checkbox.checked;
						childCheckboxes.forEach(childCheckbox => {
							childCheckbox.checked = checkboxStatus;
						});
					}
				} else if(checkbox.parentNode.className == 'compare-child-list-item') {
					const parentCheckbox = checkbox.parentNode.parentNode.parentNode.querySelector('input[type="checkbox"]');
					const siblingCheckboxes = parentCheckbox.parentNode.querySelectorAll('.compare-child-list-item input[type="checkbox"]');
					if(parentCheckbox.checked == true) {
						if(siblingCheckboxes.length == 1) {
							parentCheckbox.indeterminate = false;
						} else {
							parentCheckbox.indeterminate = true;
						}
						parentCheckbox.checked = false;
					} else {
						let checkboxesStatusIsTheSame = true;
						siblingCheckboxes.forEach(siblingCheckbox => {
							if(siblingCheckbox.checked != checkbox.checked) {
								checkboxesStatusIsTheSame = false;
							}
						});
						if(checkboxesStatusIsTheSame) {
							parentCheckbox.checked = checkbox.checked;
							parentCheckbox.indeterminate = false;
						} else {
							parentCheckbox.checked = false;
							parentCheckbox.indeterminate = true;
						}
					}
				}
				this.refresh();
				this.setLocalStorage();
			});
		});
	}

	addEventToResetButton() {

		let button = this.panel.querySelector('#compare-check-all-button');
		button.addEventListener('click', e => {

			e.preventDefault();
			// Change label
			const dataAttributeLabel = 'data-label-toggle';
			const oldLabel = button.innerText;
			const newLabel = button.getAttribute(dataAttributeLabel);
			button.innerText = newLabel;
			button.setAttribute(dataAttributeLabel, oldLabel);
			// Check/Uncheck all
			const dataAttributeChecked = 'data-checked';
			const checkValue = (button.getAttribute(dataAttributeChecked) == 'true');
			const checkboxes = this.panel.querySelectorAll('input[type="checkbox"]');
			checkboxes.forEach(checkbox => {
				checkbox.checked = checkValue;
				checkbox.indeterminate = false;
			});
			button.setAttribute(dataAttributeChecked, !checkValue);

			this.setLocalStorage();
			this.refresh();
		});
	}

	loadJSONFile() {

		if(!this.data) {
			fetch('/api/data.json')
			.then(response => {
				return response.json();
			})
			.then(json => {
				this.data = json.data;
				this.nicenames = json.nicenames;
				this.refresh();
			})
			.catch(error => {
				console.error(error);
			});
		}
	}

	refresh() {
		if(this.data) {

			if(!this.resultsContainer) {
				this.buildResultsContainer();
			}
			this.empty();
			this.buildResults();
		}
	}

	empty() {

		this.resultsContainer.innerHTML = '';
	}

	buildResults() {

		let features = this.buildFeaturesBySupportObject();
		this.buildResultsAsTags(features.y, 'Supported', 'supported');
		this.buildResultsAsTags(features.a, 'Partial support', 'mitigated');
		this.buildResultsAsTable(features.m, 'Mixed support');
		this.buildResultsAsTags(features.n, 'Not supported', 'unsupported');
		this.buildResultsAsTags(features.u, 'Support unknown', 'unknown');
	}

	buildResultsAsTable(featuresArray, title) {

		if(featuresArray.length > 0) {
			let div = document.createElement('div');
			div.className = 'post post--client';
			div.innerHTML = `<h2 class="post-title"><span class="client-name">${title}</span></h2>`;

			let wrapper = document.createElement('div');
			wrapper.className = 'clients-comparison';
			let table = document.createElement('table');
			table.className = 'clients-comparison-table';
			let thead = document.createElement('thead');
			let theadTr = document.createElement('tr');
			let theadTd = document.createElement('td');
			theadTr.append(theadTd);

			const formData = new FormData(this.form);
			for (let key of formData.entries()) {
				if(key[1].toLowerCase() !== 'on') {
					let th = document.createElement('th');
					th.setAttribute('scope', 'col');
					th.innerHTML = `<span class="data-family-name">${this.nicenames.family[key[0]]}</span><span class="data-platform-name">${this.nicenames.platform[key[1]]}</span>`;
					theadTr.append(th);
				}
			}
			thead.append(theadTr);

			let tbody = document.createElement('tbody');
			featuresArray.forEach(feature => {
				let tr = document.createElement('tr');
				let th = document.createElement('th');
				th.setAttribute('scope', 'row');
				let a = document.createElement('a');
				a.href = feature.url;
				a.textContent = feature.title;
				th.append(a);
				tr.append(th);

				for (let key of formData.entries()) {
					if(key[1].toLowerCase() !== 'on') {
						const versions = feature.stats[key[0]][key[1]];
						let supportValue = 'u';
						if(versions) {
							const lastVersionKey = Object.keys(versions)[Object.keys(versions).length - 1];
							const lastVersionValue = versions[lastVersionKey];
							if(lastVersionValue) {
								supportValue = lastVersionValue.charAt(0);
							}
						}
						let supportLongName = null;
						switch(supportValue) {
							case 'y':
								supportLongName = 'supported';
								break;
							case 'a':
								supportLongName = 'mitigated';
								break;
							case 'n':
								supportLongName = 'unsupported';
								break;
							default:
								supportLongName = 'unknown';
						}
						let td = document.createElement('td');
						td.className = supportLongName;
						td.textContent = this.nicenames.support[supportLongName];
						tr.append(td);
					}
				}
				tbody.append(tr);
			});

			table.append(thead);
			table.append(tbody);
			wrapper.append(table);
			div.append(wrapper);
			this.resultsContainer.appendChild(div);
		}
	}

	buildResultsAsTags(featuresArray, title, tagClassName) {

		if(featuresArray.length > 0) {
			let div = document.createElement('div');
			div.className = 'post post--client';
			div.innerHTML = `<h2 class="post-title"><span class="client-name">${title}</span></h2>`;

			let ul = document.createElement('ul');
			ul.className = 'client-tags';

			featuresArray.forEach(feature => {
				let li = document.createElement('li');
				let a = document.createElement('a');
				a.className = "tag " + tagClassName;
				a.href = feature.url;
				a.textContent = feature.title;
				li.append(a);
				ul.append(li);
			});

			div.append(ul);
			this.resultsContainer.appendChild(div);
		}
	}

	buildFeaturesBySupportObject() {
		let featuresBySupport = { 'y':[], 'a':[], 'n':[], 'u':[], 'm':[] };
		const formData = new FormData(this.form);
		this.data.forEach(feature => {
			let averageSupportValue = null;
			for (let key of formData.entries()) {
				if(key[1].toLowerCase() !== 'on') {
					const versions = feature.stats[key[0]][key[1]];
					if(versions) {
						const lastVersionSupportValue = versions[Object.keys(versions)[Object.keys(versions).length - 1]];
						if(lastVersionSupportValue) {
							const supportValue = lastVersionSupportValue.charAt(0);
							if(!averageSupportValue) {
								averageSupportValue = supportValue;
							} else if(averageSupportValue == 'u' && supportValue != 'u') {
								averageSupportValue = supportValue;
							} else if(averageSupportValue == 'y' && supportValue != 'y' && supportValue != 'u') {
								averageSupportValue = 'm';
							} else if(averageSupportValue == 'n' && supportValue != 'n' && supportValue != 'u') {
								averageSupportValue = 'm';
							} else if(averageSupportValue == 'a' && supportValue != 'a' && supportValue != 'u') {
								averageSupportValue = 'm';
							}
						}
					}
				}
			}
			if(averageSupportValue == 'y' || averageSupportValue == 'a' || averageSupportValue == 'n' || averageSupportValue == 'u' || averageSupportValue == 'm') {
				featuresBySupport[averageSupportValue].push(feature);
			}
		});
		return featuresBySupport;
	}

	buildResultsContainer() {

		if(document.querySelector('.main .compare-results') == null) {
			let container = document.createElement('div');
			container.classList.add('compare-results');
			container.id = 'compare-results';
			document.querySelector('.main .posts').prepend(container);
			this.resultsContainer = container;
		}
	}

	getFormDataToString() {

		const formData = new FormData(this.form);
		let formDataString = '';
		for (var key of formData.entries()) {
			if(formDataString !== '') {
				formDataString += '&';
			}
			formDataString += key[0] + '=' + key[1];
		}
		return formDataString;
	}

	setLocalStorage() {

		const data = this.getFormDataToString();
		localStorage.setItem('compare', data);
	}

	getLocalStorage() {

		return localStorage.getItem('compare');
	}
}

document.addEventListener("DOMContentLoaded", () => {
	window.compare = new Compare();
});