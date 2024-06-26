import React, { useState } from 'react';

const FileCard = ({ fileUrl }: { fileUrl: string }) => {


    return (
        <div className="group relative h-full">
            <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 px-5 border h-full border-gray-300 rounded shadow-sm animate-pulse bg-red-200 backdrop-blur-3xl
                truncate transition duration-200 ease-in-out hover:bg-slate-50 text-black`}
            >
                {fileUrl.split('/').pop()}
            </a>
        </div>
    );
};

export default FileCard;





