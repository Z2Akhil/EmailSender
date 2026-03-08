"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import grapesjs from 'grapesjs';
import gjsPresetNewsletter from 'grapesjs-preset-newsletter';
import { Loader2 } from 'lucide-react';

export interface EmailEditorWrapperRef {
    editor: any;
    exportHtml: () => Promise<{ html: string; design: any }>;
    loadDesign: (design: any) => void;
}

interface WrapperProps {
    initialDesign?: any;
    onDesignLoad?: () => void;
}

export const EmailEditorWrapper = forwardRef<EmailEditorWrapperRef, WrapperProps>(
    ({ initialDesign, onDesignLoad }, ref) => {
        const editorRef = useRef<HTMLDivElement>(null);
        const [editor, setEditor] = useState<any>(null);
        const [isLoaded, setIsLoaded] = useState(false);

        useEffect(() => {
            if (!editorRef.current) return;

            const gjsEditor = grapesjs.init({
                container: editorRef.current,
                fromElement: false,
                height: '600px',
                width: '100%',
                storageManager: false, // We handle storage manually via JSON
                plugins: [gjsPresetNewsletter],
                pluginsOpts: {
                    [gjsPresetNewsletter as any]: {
                        modalTitleImport: 'Import template',
                    }
                },
                canvas: {
                    styles: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap']
                }
            });

            gjsEditor.on('load', () => {
                setIsLoaded(true);
                if (initialDesign && Object.keys(initialDesign).length > 0) {
                    gjsEditor.loadProjectData(initialDesign);
                }
                if (onDesignLoad) onDesignLoad();
            });

            setEditor(gjsEditor);

            return () => {
                gjsEditor.destroy();
            };
        }, []);

        // Expose functions to parent component
        useImperativeHandle(ref, () => ({
            editor: editor,
            exportHtml: () => new Promise((resolve) => {
                if (!editor) {
                    resolve({ html: "", design: null });
                    return;
                }
                
                // GrapesJS + MJML uses runCommand to export standard HTML
                // But inline standard html can be retrieved via getHtml() if using basic preset
                // Using preset-newsletter gives us standard inlined HTML with runCommand 'gjs-get-inlined-html'
                
                // Some configs just get standard HTML directly
                const inlinedHtml = editor.runCommand('gjs-get-inlined-html');
                const html = typeof inlinedHtml === 'string' ? inlinedHtml : editor.getHtml();
                
                const design = editor.getProjectData();
                resolve({ html, design });
            }),
            loadDesign: (design: any) => {
                if (editor && design && Object.keys(design).length > 0) {
                    editor.loadProjectData(design);
                }
            }
        }), [editor]);

        return (
            <div className="relative w-full h-[600px] border border-gray-100 rounded-2xl overflow-hidden bg-white z-0">
                {!isLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                        <p className="text-sm font-semibold text-gray-600">Loading GrapesJS email builder...</p>
                    </div>
                )}
                <div ref={editorRef} />
            </div>
        );
    }
);

EmailEditorWrapper.displayName = 'EmailEditorWrapper';
