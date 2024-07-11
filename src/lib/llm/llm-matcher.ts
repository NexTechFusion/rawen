import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const template = `Do not explain! Return YES or NO if Text1 and Text2 have something in common.
Text1: {text1}.
Text2: {text2}.

Return:`;

export async function checkTextsMatchLLM(text1: string, text2: string, model): Promise<boolean> {

    const prompt = ChatPromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({ text1, text2 });

    if (result.includes("YES")) {
        return true;
    }

    return false;
}