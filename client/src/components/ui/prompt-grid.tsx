import { FC, MutableRefObject } from 'react';

interface Props {
  prompts: Prompt[];
  activePromptIndex: number;
  onMouseOver: (index: number) => void;
  promptListRef: MutableRefObject<HTMLDivElement | null>;
  handleSubmit: (prompt: Prompt) => void;
}

export const PromptGrid: FC<Props> = ({
  prompts,
  activePromptIndex,
  onMouseOver,
  promptListRef,
  handleSubmit,
}) => {
  return (
    <div
      ref={promptListRef}
      className="grid grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2 md:gap-4 md:p-4 border-black/10 "
    >
      {prompts.map((prompt, index) => (
        <div
          key={prompt.id}
          className={`${index === activePromptIndex
              ? 'bg-gray-200'
              : ''
            } cursor-pointer py-4 transition duration-200 flex items-center justify-center ease-in-out hover:bg-slate-50 rounded-md top-2 left-0 z-10 px-2 md:px-10
           bg-white/30 border shadow-sm`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(prompt);
          }}
          onMouseEnter={() => onMouseOver(index)}
        >
          <p className="text-md font-normal text-center text-xs md:text-sm mb-2 text-gray-500">{prompt.name}</p>
        </div>
      ))}
    </div>
  );
};