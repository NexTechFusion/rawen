import { useToast } from '@/components/ui/use-toast';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const CodeBlock = ({ className, children }) => {
    const { toast } = useToast()
    let lang = 'text';
    if (className && className.startsWith('lang-')) {
        lang = className.replace('lang-', '');
    }

    const copy = () => {
        navigator.clipboard.writeText(children);
        toast({
            description: "Copied!",
            duration: 1000
        });
    };

    function CodeContent() {
        return <>
            <div className='bg-black  prose rounded-md mb-4'>
                <div className="flex items-center relative text-gray-200 bg-gray-800 px-4 py-2 text-xs font-sans justify-between rounded-t-md">
                    <span>{lang}</span>
                    <button className="flex ml-auto gap-2" onClick={copy}>
                        Copy code
                    </button>
                </div>
                <SyntaxHighlighter style={atomOneDark} language={lang}>
                    {children}
                </SyntaxHighlighter>
            </div>
        </>
    }

    function TextContent() {
        return <><span className='font-bold'>{children}</span></>
    }

    return (
        <>
            {lang == 'text' ? <TextContent /> : <CodeContent />}
        </>
    );
}

// markdown-to-jsx uses <pre><code/></pre> for code blocks.
export const PreBlock = ({ children, ...props }) => {
    return <CodeBlock children={children} className={props.className} />;
};