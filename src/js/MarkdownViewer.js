/*
 * markdown-viewer
 * https://github.com/mognom/markdown-viewer-widget
 *
 * Copyright (c) 2017 CoNWeT
 * Licensed under the Apache-2.0 license.
 */

/* globals marked hljs Wirecloud */

(function () {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    var MarkdownViewer = function MarkdownViewer(MashupPlatform, shadowDOM, extra) {
        this.MashupPlatform = MashupPlatform;
        this.shadowDOM = shadowDOM;
        this.StyledElements = extra.StyledElements;

        this.element = this.shadowDOM.getElementById("markdown");
        this.property = this.MashupPlatform.widget.getVariable('initialMarkdownValue');

        // Allow links to be clicked
        var markdown_renderer = new marked.Renderer();
        markdown_renderer.link = function (href, title, text) {
            if (this.options.sanitize) {
                var prot = href.trim();
                if (prot.indexOf("javascript:") === 0) {
                    return "";
                }
            }

            var out = '<a href="' + href + '"';
            if (title) {
                out += ' title="' + title + '"';
            }
            out += 'target="_blank"> ' + text + '</a>';
            return out;
        };

        marked.setOptions({
            xhtml: true,
            renderer: markdown_renderer,
            highlight: function (code, lang) {
                // Avoid exception if language is wrong / being typed and do nothing
                if (hljs.listLanguages().indexOf(lang) !== -1) {
                    return hljs.highlight(lang.toLowerCase(), code).value;
                } else {
                    return code;
                }
            }
        });

        // Set the initial value
        if (this.property.get() === "") {
            this.element.innerHTML = marked('**No input received**');
        } else {
            this.element.innerHTML = marked(this.property.get());
        }

        MashupPlatform.wiring.registerCallback("input", function (input) {
            // Check input is a string
            this.setValue(input);
        }.bind(this));

        // Create editor button if current user is the workspace owner
        if (this.MashupPlatform.context.get('username') === this.MashupPlatform.mashup.context.get("owner")) {
            var editbtn = new this.StyledElements.Button({'class': 'btn-info fa fa-edit fade', 'title': 'Open editor'});
            editbtn.addEventListener("click", this.createEditorWidget.bind(this));
            editbtn.insertInto(this.shadowDOM.querySelector("body"));
        }
    };

    MarkdownViewer.prototype.setValue = function setValue(value) {
        // Update the view
        this.element.innerHTML = marked(value);

        // Store the new value
        if (this.MashupPlatform.prefs.get("save")) {
            this.property.set(value);
        }
    };

    MarkdownViewer.prototype.createEditorWidget = function createEditorWidget(event) {
        if (this.editorInput == null) {
            this.editorInput = this.MashupPlatform.widget.createOutputEndpoint();
        }

        if (this.editorWidget == null) {
            var options = {
                title: "Markdown Editor",
                width: "750px",
                height: "350px",
                refposition: event.wrapperElement.getBoundingClientRect()
            };

            // Create editor widget and bind its output
            this.editorWidget = this.MashupPlatform.mashup.addWidget('CoNWeT/markdown-editor/0.2.0', options);
            this.MashupPlatform.widget.inputs.input.connect(this.editorWidget.outputs.output);

            // Bind remove event
            this.editorWidget.addEventListener("remove", function () {
                this.editorWidget = null;
            }.bind(this));
        }

        // Send initial content
        this.editorWidget.inputs.input.connect(this.editorInput)
        this.editorInput.pushEvent(this.property.get());
    }


    Wirecloud.registerWidgetClass(document.currentScript, MarkdownViewer);

})();