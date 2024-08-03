sap.ui.define([
	"sap/base/security/encodeXML",
	"sap/base/util/Version"
], async (encodeXML, Version) => {
	"use strict";

	const sGitHub = "https://github.com/SAP/openui5/issues/";
	const sSapSupport = (() => {
		try {
			return localStorage.getItem("sap-support-url");
		} catch (e) {
			return undefined; // not available
		}
	})();

	const MAX_COLORS = 20;

	function generateStyleClasses() {
		const sheet = new CSSStyleSheet();
		for (let i = 0; i < MAX_COLORS; i++) {
			const hue = (0.6 - i / MAX_COLORS).toFixed(2);
			sheet.insertRule(
				`.patch${i}.released {background-color: hsl(${hue}turn, 80%, 80%);}`
			);
		}
		document.adoptedStyleSheets = [sheet];
	}

	async function fetchJSON(url) {
		const response = await fetch(url);
		return await response.json();
	}

	async function fetchXML(url) {
		const response = await fetch(url);
		const xml = await response.text();
		const parser = new DOMParser();
		return parser.parseFromString(xml, "text/xml");
	}

	function loadVersionInfo() {
		const url = sap.ui.require.toUrl("versiondata/resources/sap-ui-version.json");
		return fetchJSON(url);
	}

	function loadRelnotes(data) {
		const latestVersion = new Version(data.version);
		const relnotes = {};
		return Promise.all(
			data.libraries.map(async function(lib) {
				relnotes[lib.name] = {
				};

				const url = sap.ui.require.toUrl(
					/^themelib_/.test(lib.name)
					? `versiondata/resources/sap/ui/core/themes/${lib.name.slice("themelib_".length)}/.theme`
					: `versiondata/resources/${lib.name.replace(/\./g, "/")}/.library`
				);

				const doc = await fetchXML(url).catch(() => null);

				const relNotesNode = doc?.querySelector("appData>releasenotes");
				const urlPattern =  relNotesNode?.getAttribute("url");
				if ( urlPattern ) {
					let rnUrl = urlPattern.replace("{major}", latestVersion.getMajor()).replace("{minor}", latestVersion.getMinor());
					if ( relNotesNode.getAttribute("resolve") === "lib" ) {
						rnUrl = new URL(rnUrl, new URL(url, document.baseURI)).href;
					}
					relnotes[lib.name] = {
						url: rnUrl,
						changes: await fetchJSON(rnUrl).catch(() => null)
					}
				} else {
					relnotes[lib.name] = {
						url: null
					};
				}
			})
		).catch(function(err) {
			console.error(err);
		}).then(function() {
			return relnotes;
		});
	}

	const compare = (strA, strB) => strA === strB ? 0 : (strA < strB ? -1 : 1);
	const width = (span, offset = 0) => `data-width="${offset + span * 46 + (span-1) * 14}px"`;

	function renderVersionOverview(data) {

		const latestVersion = new Version(data.version);
		const numberOfPatches = latestVersion.getPatch() + 1;
		const libs = data.libraries.slice().sort((libA,libB) => compare(libA.name, libB.name));

		function formatVersion(v) {
			return String(v).replace("-SNAPSHOT", "");
		}

		function versionClasses(v) {
			if ( !v ) {
				return "";
			}
			v = new Version(v);
			return `patch${v.getPatch() % MAX_COLORS} ${v.getSuffix() ? " snapshot" : " released"}`;
		}

		const html=[];
		html.push(`<section class="release">`);
		html.push(`<div class="label" ${width(numberOfPatches, 300)}>${data.name} ${latestVersion.getMajor()}.${latestVersion.getMinor()}</div>`);
		html.push(`<div class="legend" ${width(numberOfPatches, 300)}><span class="lib"></span><span class="patch" ${width(1)}>(latest)</span></div>`);
		html.push(`<div class="header" ${width(numberOfPatches, 300)}>`);
		html.push(`<span class="lib">Patch Version</span>`);
		for ( let patch = numberOfPatches - 1; patch >= 0 ; patch-- ) {
			const span = 1;
			const patchVersion = patch < latestVersion.getPatch() ? new Version(latestVersion.getMajor(), latestVersion.getMinor(), patch) : latestVersion;
			html.push(`<span id="block-${patchVersion}" class="patch ${versionClasses(patchVersion)}" ${width(span)}>${formatVersion(patchVersion)}</span>`);
		}
		html.push(`</div>`);
		libs.forEach(function(libData) {
			html.push(`<div ${width(numberOfPatches + 1, 300)}>`);
			let last = undefined;
			let span = 0;
			html.push(`<span class="lib${libData.oldStyle ? " oldstyle" : ""}"${libData.oldStyle ? ` title="old style library (${libData.parentPom})"` : ""}>${libData.name}</span>`);
			html.push(`<span ${width(numberOfPatches)}>`);
			for ( let patch = numberOfPatches - 1; patch >= 0 ; patch-- ) {
				const libVersion = libData.patchHistory?.[patch];
				if ( last === undefined || last == libVersion ) {
					last = libVersion;
					span++;
				} else {
					if ( last !== null ) {
						html.push(`<span id="block-${libData.name}-${last}" class="patch ${versionClasses(last)}" ${width(span)}>${formatVersion(last ?? libData.version)}</span>`);
					} else {
						html.push(`<span class="patch skipped" ${width(span)}>n/a</span>`);
					}
					last = libVersion;
					span = 1;
				}
			}
			if ( span > 0 ) {
				if ( last !== null ) {
					html.push(`<span id="block-${libData.name}-${last}" class="patch ${versionClasses(last)}" ${width(span)}>${formatVersion(last ?? libData.version)}</span>`);
				} else {
					html.push(`<span class="patch skipped" ${width(span)}>n/a</span>`);
				}
			}
			html.push(`</span>`);
			html.push(`</div>`);
		});
		html.push(`</div></section>`);

		return html.join("");
	}

	function decorate(id, options) {
		const elem = document.getElementById(id);
		if ( elem ) {
			if ( options.href ) {
				// `<a href="#changes-${patchVersion}">`
				const a = document.createElement("a");
				a.href = options.href;
				while ( elem.firstChild ) {
					a.appendChild(elem.firstChild);
				}
				elem.appendChild(a);
			}
			if ( options.title ) {
				elem.title = options.title;
			}
		}
	}

	function renderChangeLog(data, relnotes) {
		const latestVersion = new Version(data.version);
		const numberOfPatches = latestVersion.getPatch() + 1;
		const libs = data.libraries.slice().sort((libA,libB) => compare(libA.name, libB.name));

		const html = [];

		function renderReferences(note) {
			const refs = note.references?.map((ref) => {
				if ( ref.type === "GitHub" ) {
					return `<a href="${sGitHub}${ref.reference}" target="_blank" rel="noopener">#${ref.reference}</a>`;
				}
				if ( ref.type === "BCP" ) {
					if ( sSapSupport ) {
						return `<a href="${sSapSupport}${ref.reference}" target="_blank" rel="noopener">#${ref.reference}</a>`;
					}
					return `<span>#${ref.reference}</span>`;
				}
			}).filter(Boolean);

			return refs?.length > 0 ? `<span class="refs"> (${refs.join(", ")})</span>` : "";
		}

		let patch = numberOfPatches;
		html.push(`<h2>Change Log</h2>`);
		while ( --patch >= 0 ) {
			const patchVersion = patch < latestVersion.getPatch() ? new Version(latestVersion.getMajor(), latestVersion.getMinor(), patch) : latestVersion;
			html.push(`<section class="patchinfo">`);
			html.push(`<div id="changes-${patchVersion}" class="label" ${width(numberOfPatches, 300)}>${patchVersion}</div>`);
			const counts = {
				libs: 0,
				totalChanges: 0,
				changes: 0
			};
			libs.forEach(function(libData) {
				const libPatchVersionStr = (libData.patchHistory?.[patch]) ?? libData.version;
				if ( libPatchVersionStr
					 && patch === 0 || (libData.patchHistory?.[patch - 1] !== libPatchVersionStr) ) {
					const libPatchVersion = new Version(libPatchVersionStr);
					const libNotes = relnotes[libData.name];
					const libPatchVersionInChanges = new Version(libPatchVersion.getMajor(), libPatchVersion.getMinor(), libPatchVersion.getPatch());
					const changes = libNotes?.changes?.[libPatchVersionInChanges];
					if ( changes ) {
						counts.libs++;
						counts.changes = 0;
						html.push(`<div id="changes-${libData.name}-${libPatchVersion}" class="lib">${libData.name} <span class="version">(${libPatchVersion})</span></div>`);
						changes.notes.filter(Boolean).sort(
							(noteA, noteB) => compare(noteA.text, noteB.text)
						).forEach((note) => {
							counts.changes++;
							counts.totalChanges++;
							const refs = renderReferences(note);
							html.push(`<div class="change"><span class="sha">${note.id.slice(0,7)}</span> <span class="commitmsg">${encodeXML(note.text)}</span>${refs}</div>`);
						});
						decorate(`block-${libData.name}-${libPatchVersion}`, {
							href: `#changes-${libData.name}-${libPatchVersion}`,
							title:
								(counts.changes == 0 ? "no" : counts.changes)
								+ ` documented ${counts.changes == 1 ? "change" : "changes"}`
						});
					}
				}
			});
			html.push(`</section>`);
			decorate(`block-${patchVersion}`, {
				href: `#changes-${patchVersion}`,
				title:
					(counts.totalChanges == 0 ? "no" : counts.totalChanges)
					+ ` documented ${counts.totalChanges == 1 ? "change" : "changes"}`
					+ ` in ${counts.libs} ${counts.libs == 1 ? "library" : "libraries"}`
			});
		}

		return html.join("");
	}

	generateStyleClasses();

	const versionInfo = await loadVersionInfo();
	document.title = `${versionInfo.name} - Version Overview`;
	document.body.insertAdjacentHTML("beforeEnd", renderVersionOverview(versionInfo));
	document.body.querySelectorAll("[data-width]").forEach(
		(elem) => {
			elem.style.width = elem.dataset.width;
			delete elem.dataset.width;
		}
	);
	document.querySelector("#placeholder").remove();

	const relnotes = await loadRelnotes(versionInfo);
	document.body.insertAdjacentHTML("beforeEnd", renderChangeLog(versionInfo, relnotes));

});
