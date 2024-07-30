import "pdf-parse"; // Peer dep
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "langchain/text_splitter";
import readXlsxFile, { readSheetNames } from 'read-excel-file/node'
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { Document } from "langchain/document";
import { img2Text } from "../shared/utils/tesseract";
const chunkSize = 1200;
const chunkOverlap = 60;

export async function splitImage(file: any) {
    const img = await img2Text(file.buffer);
    const txt = img.data.text;

    const textSplitter = new CharacterTextSplitter({
        chunkSize,
        chunkOverlap,
        separator: '\n'
    });

    const docOutput = await textSplitter.createDocuments(
        [txt]
    );

    return getMetaData(docOutput, file.originalname, file.path);
}

export async function splitXlsx(file: any) {
    const sheets = await readSheetNames(file.buffer);

    const outPut: any[] = [];
    for (let sheetname of sheets) {
        const rows = await readXlsxFile(file.buffer, { sheet: sheetname });

        const textSplitter = new CharacterTextSplitter({
            chunkSize,
            chunkOverlap,
            separator: '\n'
        });

        // const header = rows.shift();
        // const data = rows.map((row) => JSON.stringify({
        //     header,
        //     data: row
        // }).replace(/\\/g, "'"));

        const result = rows.slice(1).map(row => {
            let obj: any = {};
            rows[0].forEach((header: string, index) => {
                obj[header] = row[index];
            });
            return JSON.stringify(obj).replace(/\"/g, "'");
        });

        const docOutput = await textSplitter.createDocuments(
            [result.join('\n\n')]
        );

        outPut.push(...docOutput);
    }

    return getMetaData(outPut, file.originalname, file.path);
}

export async function splitCsv(file: any) {
    const loader = new CSVLoader(file.path);
    let splittedDocs = await loader.loadAndSplit();
    const name = file.originalname;

    // const textSplitter = new RecursiveCharacterTextSplitter({
    //     chunkSize,
    //     chunkOverlap
    // });

    // let splittedDocs = await textSplitter.splitDocuments(resdocs);

    splittedDocs = splittedDocs.map((doc: Document) => ({
        ...doc,
        pageContent: cleanText(doc.pageContent),
        metadata: {
            ...doc.metadata,
        }
    }));

    return getMetaData(splittedDocs, name, file.path);
}

export async function splitPdf(file: any) {
    const blob = new Blob([file.buffer]);
    const pdfLoader = new PDFLoader(blob, {
        splitPages: true
    });
    const resdocs = await pdfLoader.load();
    const name = file.originalname;

    const textSplitter = new CharacterTextSplitter({
        chunkSize,
        chunkOverlap,
        separator: '\n',
    });

    let splittedDocs = await textSplitter.splitDocuments(resdocs);

    splittedDocs = splittedDocs.map((doc: Document) => ({
        ...doc,
        pageContent: doc.pageContent,
    }));

    return getMetaData(splittedDocs, name, file.path);
}

export async function splitText(file: { text: string, name: string, path?: string, metaData?: any }) {
    const textSplitter = new CharacterTextSplitter({
        separator: '\n',
        chunkSize,
        chunkOverlap,
    });

    const docOutput = await textSplitter.createDocuments(
        [file.text],
        [{}]
    );

    return getMetaData(docOutput, file.name, file.path, file.metaData);
}

function cleanText(text: string) {
    text = text.replace(/(Header|Footer):.+/g, '');
    text = text.replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII characters
    text = text.replace(/(\w+)\s-\s(\w+)/g, '$1$2');
    return text;
}

function getMetaData(splittedDocs: any[], name: string, filePath?: string, metaData?: any) {
    return splittedDocs.map((doc: Document) => ({
        ...doc,
        pageContent: doc.pageContent,
        id: name,
        metadata: {
            id: name,
            date: new Date().toISOString(),
            ...(filePath ? { file_path: filePath } : {}),
            ...(doc.metadata.loc?.pageNumber ? { file_page_number: doc.metadata.loc?.pageNumber ?? "?" } : {}),
            ...(doc.metadata.loc?.lines ? { file_page_lines_from: doc.metadata.loc?.lines?.from ?? "?", file_page_lines_to: doc.metadata.loc?.lines?.to ?? "?" } : {}),
            ...(doc.metadata.loc?.totalPages ? { file_total_pages: doc.metadata.loc?.totalPages ?? "?" } : {}),
            ...metaData
        }
    }));
}