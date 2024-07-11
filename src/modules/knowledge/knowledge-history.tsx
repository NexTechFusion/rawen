import { useEffect, useRef, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { FolderOutput } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TagInput from "@/components/ui/tag-input";
dayjs.extend(relativeTime);
interface Props {
    docs: any;
    images: any;
    onDelete: (id: string) => void;
    onDeleteImage: (data: { id: string; filePath: string }) => void;
    onUpdate: (fileData: any) => void;
}

const KnowledgeHistory: React.FC<Props> = ({ docs, images, onDelete, onUpdate, onDeleteImage }) => {
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const filePathRef = useRef<HTMLInputElement>(null);
    const [tags, setTags] = useState<string[]>([]);

    useEffect(() => {
        const allTags = [];
        for (let doc of Object.keys(docs)) {
            const { tags } = extractFile(doc);
            allTags.push(...tags);
        }

        //remove duplicates
        const uniqueTags = [...new Set(allTags)];
        setTags(uniqueTags);

    }, [docs]);

    function openLink(e: any, filePath: string) {
        e.preventDefault();
        e.stopPropagation();
        window.open(filePath);
    }

    const extractFile = (doc: any) => {

        let title = (doc ?? "");
        const objs: any = docs[doc] as [];

        // if (title.indexOf(".") > 0) {
        //     title = title.substring(0, title.lastIndexOf("."));
        // }

        // const fullText = objs?.map((o: any) => o.pageContent).join("")?.replace(/\n/gi, '<br/>') ?? "";
        const fullText = objs?.map((o: any) => o.pageContent).join("") ?? "";
        const date = new Date(objs[0]?.metadata?.date).toLocaleDateString();
        const dateStr = dayjs(objs[0]?.metadata?.date).fromNow();
        const filePath = objs[0]?.metadata?.file_path;
        let tags = objs[0]?.metadata?.tags?.split(",") ?? [];
        const isImageRelation = tags.includes("image");
        const relations = objs[0]?.metadata?.relations ?? [];
        tags = tags.filter((t: string) => t.length > 0);

        return { date, title, filePath, fullText, id: doc, dateStr, tags, isImageRelation, relations };
    }

    function onClickSelected(doc: any) {
        const { date, title, filePath, fullText, id, tags, relations, isImageRelation } = extractFile(doc);
        setSelectedFile({ date, title, filePath, fullText, id, tags, relations, isImageRelation });
    }

    const saveChanges = () => {
        const updateObj = {
            id: selectedFile.id,
            date: selectedFile.date,
            file_path: filePathRef.current?.value ?? "",
            text: textRef.current?.value,
            tags: (selectedFile.tags ?? []).join(",")
        };

        onUpdate(updateObj);
        setSelectedFile(null);
    }

    const deleteFromKnowledge = () => {
        onDelete(selectedFile.id);

        if (selectedFile.isImageRelation) {
            const { relations } = selectedFile;
            for (let r of relations) {
                onDeleteImage({ id: r.id, filePath: selectedFile.filePath });
            }
        }

        setSelectedFile(null);
    }

    function Content({ doc }: any) {
        const { dateStr, title, filePath, fullText, isImageRelation } = extractFile(doc);

        return <>
            <TableCell className="font-medium text-xs text-ellipsis overflow-hidden align-middle items-center flex" style={{ maxWidth: "35vw" }}>
                {isImageRelation && <span className="mr-2"> <img onClick={(e) => openLink(e, filePath)} src={filePath} className="h-14 w-14" /></span>}
                {title}
            </TableCell>
            <TableCell align="center">
                <Tooltip>
                    <TooltipTrigger asChild>
                        {filePath && <FolderOutput onClick={(e) => openLink(e, filePath)} xlinkTitle="text" className="h-4 w-4" />}
                    </TooltipTrigger>
                    <TooltipContent>
                        Open {filePath}
                    </TooltipContent>
                </Tooltip>
            </TableCell>
            <TableCell align="center">{fullText?.length}</TableCell>
            <TableCell className="text-xs/4 text-right">{dateStr}</TableCell>
        </>
    }

    const tagsChanged = (newTags: string[]) => {
        selectedFile.tags = newTags;
        setSelectedFile({ ...selectedFile });
    }

    function TextContent() {
        return <>
            <TooltipProvider>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead className="w-[20px]">Path</TableHead>
                            <TableHead className="w-[20px]">Length</TableHead>
                            <TableHead className="w-[120px] text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.keys(docs).map((doc: any) => <TableRow onClick={() => onClickSelected(doc)} className="cursor-pointer"> <Content doc={doc} /> </TableRow>)}
                    </TableBody>
                </Table>
            </TooltipProvider>

            <Dialog open={selectedFile}>
                <DialogContent onClose={() => setSelectedFile(null)}
                    style={{ minHeight: "95vh", height: "95vh", minWidth: "95vw", overflow: "auto" }}>
                    <div className="flex flex-col">
                        <div className="p-4 overflow-auto text-xs flex flex-1 flex-col">
                            <Textarea className="flex-1" ref={textRef} defaultValue={selectedFile?.fullText ?? ""} style={{ flex: "1" }} />
                            <div className="my-2 flex gap-1 justify-center align-middle items-center">
                                <Label className="mr-2">Path</Label>
                                <Input className="flex-1" defaultValue={selectedFile?.filePath} ref={filePathRef} />
                            </div>
                            <div className="my-2 flex gap-1 justify-center align-middle items-center">
                                <Label className="mr-2">Tags</Label>
                                <TagInput initialTags={selectedFile?.tags ?? []} onTagsChanged={tagsChanged} suggestions={tags} />
                            </div>
                            <div className="text-right">
                                <Button variant="ghost" size="sm" className="text-red-500 text-xs" onClick={deleteFromKnowledge}>
                                    Delete from knowledge
                                </Button>
                            </div>
                        </div>

                        <DialogFooter style={{ justifyContent: "center" }} className="pt-2 flex flex-row">
                            <Button variant="ghost" className="mr-1" onClick={() => setSelectedFile(null)}>Cancel</Button>
                            <Button type="submit" className="w-28" variant="default" onClick={saveChanges}>Save</Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    }

    function ImageContent() {
        const imgMapped = Object.keys(images ?? {}).map((img: any) => {
            const { path, relations, id, date } = images[img];
            return { path, relations, id, date };
        });

        return <>
            <div className="grid gap-2">
                {imgMapped.map((img: any) => <div>
                    <img src={img.path} className="w-full h-auto" />
                </div>)}
            </div>
        </>
    }

    return <>
        <div className="px-4 pb-2">
            <TextContent />
            <hr />
            <ImageContent />
        </div>
    </>
}

export default KnowledgeHistory;
