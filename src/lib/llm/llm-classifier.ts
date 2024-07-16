import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const template = `Do not explain! Return the best matching option number to a given text.
Return 0 if none of the options are good.

Options: 
0.None 
1.Calling friends
2.Summarizing a URL 
3.Summarizing a youtube video
Text: Summarize youtube.com/watch?v=12345
Best option: 3 

Options:
0.None
1.Calling friends
2.Summarizing a URL
3.Summarizing a youtube video
Text: What are cool places to visit in Paris?
Best option: 0

Options: {classes}.
Text: {text}
Best option:`

export async function classfifyTextLLM(text: string, classes: string[], model): Promise<string> {
    const prompt = ChatPromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({ text, classes: classes.map((o, index) => `\n${index+1}.${o}`).join("") });

    return result;
}