import React, { useState, KeyboardEvent, ChangeEvent, useEffect } from 'react';
import { Badge } from './badge';
import { Input } from './input';
import { X } from 'lucide-react';

interface TagsInputProps {
    initialTags: string[];
    suggestions: string[];
    onTagsChanged: (newTags: string[]) => void;
}

const TagsInput: React.FC<TagsInputProps> = ({ initialTags, suggestions, onTagsChanged }) => {
    const [tags, setTags] = useState<string[]>(initialTags);
    const [input, setInput] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (input) {
            setFilteredSuggestions(suggestions.filter(suggestion =>
                suggestion.toLowerCase().includes(input.toLowerCase())
            ));
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }, [input, suggestions]);

    const removeTag = (indexToRemove: number) => {
        const newTags = tags.filter((_, index) => index !== indexToRemove);
        setTags(newTags);
        onTagsChanged(newTags);
    };

    const addTag = (tag: string) => {
        const newTags = [...tags, tag];
        setTags(newTags);
        onTagsChanged(newTags);
        setInput('');
        setShowSuggestions(false);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && input) {
            addTag(input.trim());
        }
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value);
    };

    const handleSuggestionClick = (e, suggestion: string) => {
        e.preventDefault();
        e.stopPropagation();

        addTag(suggestion);
    };

    return (
        <div className='flex gap-2 w-full flex-wrap'>
            <div className='flex gap-2'>
                {tags.map((tag, index) => (
                    <Badge variant='secondary' key={index} className='flex gap-2'>
                        {tag}
                        <X className="h-4 w-4 cursor-pointer" onClick={() => removeTag(index)} />
                    </Badge>
                ))}
            </div>
            <div className='relative w-1/5'>
                <Input placeholder='+ Tag' className='w-full' value={input} onKeyDown={handleKeyDown} onChange={handleInputChange} />
                {showSuggestions && (
                    <div className="suggestions-dropdown absolute left-0 z-10 bottom-10 w-44 rounded-md bg-accent/50 shadow-lg focus:outline-none max-h-48 overflow-auto">
                        {filteredSuggestions.map((suggestion, index) => (
                            <div key={index} className="suggestion-item block px-2 py-1 text-xs bg-accent hover:opacity-60 cursor-pointer border-b" onClick={(e) => handleSuggestionClick(e, suggestion)}>
                                {suggestion}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TagsInput;
