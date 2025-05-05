const fs = require('fs');
const JSON5 = require('json5');

function toLatOrLon(input) {
    if (input.endsWith("W"))
        return -Number(input.slice(0, -1));
    else if (input.endsWith("N"))
        return Number(input.slice(0, -1));
    else
        return Number(input);
}

function addSite(line, sites) {
    const fields = line.split(",");
    if (fields.length === 5 && fields[0].startsWith('s0')) {
        sites.push({
            site: fields[0],
            nameEn: fields[1],
            nameFr: "",
            prov: fields[2],
            latitude: toLatOrLon(fields[3]),
            longitude: toLatOrLon(fields[4])
        });
    }
}

function updateSite(line, sites) {
    const fields = line.split(",");
    if (fields.length === 5 && fields[0].startsWith('s0')) {
        const site = sites.find((s) => s.site === fields[0]);
        if (site) {
            site.nameFr = fields[1];
        } else {
            console.log(`Error: site not found: ${fields[0]}`);
        }
    }
}

async function go() {
    const sites = [];
    const resEn = await fetch('https://dd.weather.gc.ca/citypage_weather/docs/site_list_en.csv');
    const enText = await resEn.text();
    enText.split("\n").forEach((line) => addSite(line, sites));

    const resFr = await fetch('https://dd.weather.gc.ca/citypage_weather/docs/site_list_fr.csv');
    const frText = await resFr.text();
    frText.split("\n").forEach((line) => updateSite(line, sites));

    const resXml = await fetch('https://dd.weather.gc.ca/citypage_weather/xml/siteList.xml');
    const xmlText = await resXml.text();

    var siteLocations = "";

    var numChecked = 0;
    xmlText.split("\n").forEach((line) => {
        const idx = line.indexOf('code="s0');
        if (idx > 0) {
            const siteCode = line.slice(idx + 6, -2);
            const site = sites.find((s) => s.site === siteCode);
            if (!site) {
                siteLocations += `// XML Site not found: ${siteCode}\n`;
            } else {
                numChecked++;
            }
        }
    });
    siteLocations += "export default " + JSON5.stringify(sites, { space: 4, quote: '"' }) + ";";
    fs.writeFileSync('./constants/sitelocations.js', siteLocations);
}

go();
