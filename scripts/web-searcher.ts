import puppeteer from "puppeteer-extra";
import html2md from 'html-to-md'
const axios = require("axios");
const { load } = require("cheerio");
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());

async function getBodyContent(url) {
    try {
        const response = await axios.get(url);
        const $ = load(response.data);

        $("div[role='navigation']").remove();
        $('nav').remove();
        $('img').remove();
        $('footer').remove();
        $('ul:has(a)').remove();
        $('pre:has(a)').remove();

        let modifiedHTML = $.html();

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

        return formattedContent;
    } catch (error) {
        console.error('Error fetching and parsing the webpage:', error);
        return "";
    }
}

async function google_search(query) {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process',
            '--no-zygote',
            '--disable-gpu']
    });
    try {

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 3000 });

        let url = `https://google.com/search?q=${query}`;
        try {
            await page.goto(url);
        } catch (error) {
            console.error('Error navigating to page:', error);
        }

        await page.waitForSelector("div.yuRUbf a");

        const links = await page.evaluate(() => {
            const linkNodes = document.querySelectorAll("div.yuRUbf a");
            return Array.from(linkNodes)
                .filter((anchor: any) =>
                    anchor.href != null &&
                    !anchor.href?.includes("https://www.google") &&
                    !anchor.href?.includes("https://translate.google"))
                .slice(0, 3)
                .map((anchor: any) => {
                    const title = anchor.innerText.trim();
                    const url = anchor.href;
                    return { title, url };
                });
        });
        return links;
    } catch (error) {
        console.error('Error navigating to page:', error);
        return [];
    } finally {
        browser.close();
    }
}

async function visit_website(url, title) {
    const content = await getBodyContent(url);
    return { url, content, title };
}


function removeHtmlTags(inputString) {
    return inputString.replace(/<[^>]*>/g, "");
}

/**
 * Gathers information from the web based on the query
 * @param url 
 * @returns 
 */
export async function searchWeb(query: string): Promise<{ url: string, content: string, title: string }[]> {
    try {
        const gResponse = await google_search(removeHtmlTags(query));
        const informations = [];

        const promises = [];
        for (const link of gResponse) {
            promises.push(visit_website(link?.url, link?.title));
        }

        const promiseResult = await Promise.all(promises);

        const flattenResult = promiseResult.flat();
        informations.push(...flattenResult);

        return informations;
    } catch (error) {
        console.error('Error navigating to page:', error);
        return [];
    }
}

