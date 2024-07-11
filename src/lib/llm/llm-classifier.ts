import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const template = `Do not explain! Return the best variable relation to a given text.

Variables: {classes}.
Text: {text}
Best variable:`

export async function classfifyTextLLM(text: string, classes: string[], model): Promise<string> {
    const prompt = ChatPromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({ text, classes: classes.join(", ") });

    return result;
}