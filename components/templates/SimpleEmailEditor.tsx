"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    List, ListOrdered, Quote, Minus, Link2, Image as ImageIcon,
    AlignLeft, AlignCenter, AlignRight, Undo2, Redo2,
    Heading1, Heading2, Type, User, AtSign, MousePointerClick, ChevronDown
} from "lucide-react";

export interface SimpleEmailEditorRef {
    /** Returns email-ready HTML (wrapped in a 600px shell) plus the raw editor JSON for re-editing. */
    getHtml: () => { html: string; json: any };
    isEmpty: () => boolean;
}

interface Props {
    initialContent?: any; // TipTap JSON
}

/**
 * Wraps the editor's HTML in an email-client-friendly shell:
 * centered 600px column, safe fonts, sensible defaults.
 */
export function wrapEmailHtml(innerHtml: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;">
  <div style="display:none;max-height:0;overflow:hidden;">&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:32px 40px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#333333;">
${innerHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const VARIABLES = [
    { label: "First name", value: "{{firstName}}", icon: User },
    { label: "Email address", value: "{{email}}", icon: AtSign },
];

function ToolbarButton({
    onClick, active, title, children, disabled,
}: {
    onClick: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${active ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
        >
            {children}
        </button>
    );
}

export const SimpleEmailEditor = forwardRef<SimpleEmailEditorRef, Props>(({ initialContent }, ref) => {
    const [varMenuOpen, setVarMenuOpen] = useState(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2] },
                link: { openOnClick: false },
            }),
            Image.configure({ inline: false }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Placeholder.configure({
                placeholder: "Write your email here… Use the toolbar to add images, buttons and personalization.",
            }),
        ],
        content: initialContent || "",
        editorProps: {
            attributes: {
                class: "simple-email-content focus:outline-none min-h-[380px] px-8 py-6",
            },
        },
    });

    useImperativeHandle(ref, () => ({
        getHtml: () => ({
            html: editor ? wrapEmailHtml(editor.getHTML()) : "",
            json: editor ? editor.getJSON() : null,
        }),
        isEmpty: () => !editor || editor.isEmpty,
    }), [editor]);

    if (!editor) {
        return <div className="min-h-[420px] bg-gray-50 rounded-2xl animate-pulse" />;
    }

    const setLink = () => {
        const prev = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("Link URL", prev || "https://");
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    const addImage = () => {
        const url = window.prompt("Image URL (https://…)");
        if (url) editor.chain().focus().setImage({ src: url }).run();
    };

    const addButton = () => {
        const label = window.prompt("Button text", "Click here");
        if (!label) return;
        const url = window.prompt("Button link URL", "https://");
        if (!url) return;
        editor.chain().focus().insertContent(
            `<p style="text-align:center"><a href="${url}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">${label}</a></p><p></p>`
        ).run();
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 px-3 py-2 bg-gray-50/60 sticky top-0 z-10">
                <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                    <Undo2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                    <Redo2 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-gray-200 mx-1.5" />

                <ToolbarButton title="Normal text" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
                    <Type className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Big heading" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Small heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-gray-200 mx-1.5" />

                <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                    <UnderlineIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-gray-200 mx-1.5" />

                <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Divider line" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                    <Minus className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-gray-200 mx-1.5" />

                <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-gray-200 mx-1.5" />

                <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}>
                    <Link2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Image from URL" onClick={addImage}>
                    <ImageIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Button" onClick={addButton}>
                    <MousePointerClick className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-gray-200 mx-1.5" />

                {/* Personalization dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setVarMenuOpen(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        <User className="w-3.5 h-3.5" />
                        Personalize
                        <ChevronDown className="w-3 h-3" />
                    </button>
                    {varMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setVarMenuOpen(false)} />
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-44">
                                {VARIABLES.map(v => {
                                    const Icon = v.icon;
                                    return (
                                        <button
                                            key={v.value}
                                            type="button"
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={() => {
                                                editor.chain().focus().insertContent(v.value).run();
                                                setVarMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                                        >
                                            <Icon className="w-4 h-4 text-gray-400" />
                                            {v.label}
                                            <span className="ml-auto text-[10px] text-gray-400 font-mono">{v.value}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Editing surface, framed like the final 600px email */}
            <div className="bg-gray-100 flex-1 overflow-auto py-8 px-4">
                <div className="max-w-[600px] mx-auto bg-white rounded-lg shadow-sm">
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
});

SimpleEmailEditor.displayName = "SimpleEmailEditor";
