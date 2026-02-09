import { Button } from "@/components/ui/button";
import { POST_CATEGORIES } from "@shared/schema";

interface CategoryFilterProps {
    selected: string | null;
    onSelect: (category: string | null) => void;
}

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
    return (
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
            <Button
                variant={selected === null ? "default" : "secondary"}
                onClick={() => onSelect(null)}
                className="rounded-full whitespace-nowrap text-xs sm:text-sm h-7 sm:h-8 px-2.5 sm:px-3"
                size="sm"
            >
                All
            </Button>

            {POST_CATEGORIES.map((category) => (
                <Button
                    key={category}
                    variant={selected === category ? "default" : "secondary"}
                    onClick={() => onSelect(category)}
                    className="rounded-full whitespace-nowrap text-xs sm:text-sm h-7 sm:h-8 px-2.5 sm:px-3"
                    size="sm"
                >
                    {category}
                </Button>
            ))}
        </div>
    );
}
