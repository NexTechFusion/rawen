import { extractDataFromWebsite } from "../../../../scripts/website-extractor";
import { KeyValueSettings } from "../../../../shared/models/app-state.model";
import { Service } from "typedi";
import { mapToLanceModel, update } from '../../../../scripts/local-lancedb.store';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

@Service()
export class WebsiteTrainerService {
    readonly CHUNK_SIZE = 500;

    public async trainWebsite(url: string, config: {
        maxConcurrency?: number,
        maxDepth?: number,
        keyValues?: KeyValueSettings,
        storeId?: string
    }) {
        try {
            console.log('training begin');
            let res = await extractDataFromWebsite(url, config.maxDepth ?? 1);
            let textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 50,
                separators: ["##", "\n\n"]
            });

            let docs = [];
            for (let r of res) {
                let urlString = r.url;
                let splitDocs = await textSplitter.createDocuments([r.content]);

                let docsWithMeta = splitDocs.map((d) => ({
                    pageContent: d.pageContent,
                    metadata: {
                        id: urlString,
                        ...(urlString ? { file_path: urlString } : {}),
                        date: new Date().toISOString(),
                        ...(d?.metadata.loc?.pageNumber ? { file_page_number: d?.metadata.loc?.pageNumber ?? "?" } : {}),
                        ...(d?.metadata.loc?.lines ? { file_page_lines_from: d?.metadata.loc?.lines?.from ?? "?", file_page_lines_to: d?.metadata.loc?.lines?.to ?? "?" } : {}),
                        ...(d?.metadata.loc?.totalPages ? { file_total_pages: d?.metadata.loc?.totalPages ?? "?" } : {}),
                    }
                }));
                docs.push(...docsWithMeta);
            }

            console.log('training store', docs.length);
            await update({
                data: mapToLanceModel(docs),
                table: config?.storeId ?? 'global'
            });
            console.log('training finished');
        } catch (e) {
            console.log('training failed');
            console.log(e);
        }
    }
}