import url from 'url';
import html2md from 'html-to-md'
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { load } from "cheerio";

let excludedUrls = ["privacy", "datenschutz", "policy", "impressum", "imprint", "terms", "conditions", "agb"];

export async function extractDataFromWebsite(baseUrl: string, maxDepth: number = 1) {
    puppeteer.use(StealthPlugin());
    let docList: any[] = [];
    let websiteContent = "";
    let links: string[] = [];
    let visitedUrls = new Set<string>();
    let browser;

    async function extractDataFromUrl(urlString: string) {
        try {

            // append https if not present
            if (!urlString.startsWith("http")) {
                urlString = "https://" + urlString;
            }

            let currentUrl = new URL(urlString);

            if (currentUrl.hostname !== url.parse(baseUrl).hostname) {
                return;
            }

            console.log("Visiting: " + urlString);

            browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--single-process',
                    '--no-zygote',
                    '--disable-gpu']
            });
            let page = await browser.newPage();
            page.setViewport({ width: 1280, height: 1500 });
            await page.goto(urlString);
            await page.waitForSelector("body");
            await page.waitForTimeout(1000);

            websiteContent = await page.evaluate(() => {
                let body = document.querySelector("body");
                let bodyContent = body?.innerHTML ?? "";


                return bodyContent;
            });

            let foundLinks = await page.$$eval("a[href]", (elements: any[]) =>
                elements.map((element) => element.href)
            );

            await browser.close();
            let visitedUrls = new Set();

            links = foundLinks.filter((link) => {
                let linkUrl = new URL(link);
                let meetsCriteria =
                    (link.startsWith("http://") || link.startsWith("https://") || link.startsWith("www")) &&
                    linkUrl.toString().includes(baseUrl) &&
                    !excludedUrls.some((excluded) => linkUrl.pathname.toLowerCase().includes(excluded)) &&
                    baseUrl != link &&
                    !link.split("/").pop().includes("#") // anchor links

                if (meetsCriteria) {
                    if (!visitedUrls.has(link)) {
                        visitedUrls.add(link);
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            });
        } catch (e) {
            if (browser) {
                await browser.close();
            }
            console.error(e);
            return;
        }

        let modifiedHTML = websiteContent;
        const $ = load(websiteContent);
        $("div[role='navigation']").remove();
        $('nav').remove();
        $('img').remove();
        $('footer').remove();
        $('ul:has(a)').remove();
        $('pre:has(a)').remove();
        modifiedHTML = $.html();

        let formattedContent = html2md(modifiedHTML, {
            ignoreTags: ['style', 'head', '!doctype', 'form', 'svg', 'noscript', 'script', 'meta', 'button', 'header'],
            skipTags: ['div', 'html', 'body', 'nav', 'section', 'footer', 'main', 'aside', 'article'],
            emptyTags: [],
            aliasTags: {
                'figure': 'p',
                'dl': 'p',
                'dd': 'p',
                'dt': 'p',
                'figcaption': 'p'
            },
            renderCustomTags: true
        }, true)

        // kick useless content that is to short
        if (formattedContent.length > 300) {
            docList.push({
                url: urlString,
                content: formattedContent
            });
        } else {
            console.log("Website content too short: ", websiteContent.length);
            maxDepth++; // increase max depth cause we skipped
        }

        for (let link of links) {
            if (!visitedUrls.has(link)) {

                if (visitedUrls.size >= maxDepth) {
                    return;
                }

                visitedUrls.add(link);
                try {
                    await extractDataFromUrl(link);
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }

    visitedUrls.add(baseUrl);
    await extractDataFromUrl(baseUrl);

    return docList;
}
