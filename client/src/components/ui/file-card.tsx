import React, { useState } from 'react';

const FileCard = ({ fileUrl }: { fileUrl: string }) => {


    return (
        <div className="h-full mx-auto">
            <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 px-5 h-full rounded shadow-sm animate-pulse bg-red-200 transition duration-200 ease-in-out hover:bg-slate-50 text-black`}
            >
                {fileUrl.split('/').pop()}
            </a>
        </div>
    );
};

export default FileCard;





