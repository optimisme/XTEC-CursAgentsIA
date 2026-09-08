import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

app.registerExtension({
    name: "classroom.preview",
    afterConfigureGraph() {
        if (!app.graph.extra?.classroom_auto_spacing) return;
        const nodes = app.graph._nodes;
        const originalX = new Map(nodes.map(node => [node, node.pos[0]]));
        const groups = (app.graph._groups || []).map(group => ({
            group,
            nodes: nodes.filter(node => node.pos[0] >= group.pos[0]
                && node.pos[0] < group.pos[0] + group.size[0]
                && node.pos[1] >= group.pos[1]
                && node.pos[1] < group.pos[1] + group.size[1]),
        }));
        const context = document.createElement("canvas").getContext("2d");
        context.font = "bold 14px Arial";
        for (const node of nodes) {
            const minimum = node.computeSize();
            node.setSize([
                Math.max(node.size[0], minimum[0], Math.ceil(context.measureText(node.title).width) + 100),
                Math.max(node.size[1], minimum[1]),
            ]);
        }
        const placed = [];
        let previousX;
        let previousNewX;
        for (const x of [...new Set(originalX.values())].sort((a, b) => a - b)) {
            const column = nodes.filter(node => originalX.get(node) === x);
            let newX = previousX === undefined ? x : Math.max(x, previousNewX + x - previousX);
            for (const node of column) {
                for (const other of placed) {
                    if (node.pos[1] - 30 < other.pos[1] + other.size[1] + 20
                        && node.pos[1] + node.size[1] + 20 > other.pos[1] - 30) {
                        newX = Math.max(newX, other.pos[0] + other.size[0] + 100);
                    }
                }
            }
            for (const node of column) node.pos[0] = newX;
            placed.push(...column);
            previousX = x;
            previousNewX = newX;
        }
        for (const { group, nodes: members } of groups) {
            if (!members.length) continue;
            const left = Math.min(...members.map(node => node.pos[0])) - 40;
            const right = Math.max(...members.map(node => node.pos[0] + node.size[0])) + 40;
            group.pos[0] = left;
            group.size[0] = right - left;
        }
        app.graph.setDirtyCanvas(true, true);
    },
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (!["ClassroomShowText", "ClassroomSaveWav", "ClassroomComposeVideo"].includes(nodeData.name)) return;
        const original = nodeType.prototype.onExecuted;
        nodeType.prototype.onExecuted = function (message) {
            original?.apply(this, arguments);
            if (!this.classroomPreview) {
                const element = document.createElement("div");
                Object.assign(element.style, { overflow: "auto", color: "#eee", background: "#222", padding: "8px", whiteSpace: "pre-wrap", fontSize: "13px" });
                this.addDOMWidget("classroom_preview", "custom", element, { serialize: false });
                this.classroomPreview = element;
            }
            const element = this.classroomPreview;
            element.replaceChildren();
            const text = document.createElement("div");
            text.textContent = (message.text || []).join("\n");
            element.append(text);
            const file = message.classroom_video?.[0] || message.audio?.[0]?.filename;
            if (file) {
                const media = document.createElement(message.classroom_video ? "video" : "audio");
                media.controls = true;
                media.style.width = "100%";
                media.src = api.apiURL(`/view?${new URLSearchParams({ filename: file, subfolder: "classroom", type: "output" })}`);
                element.append(media);
            }
            this.setSize([Math.max(this.size[0], 360), Math.max(this.size[1], 260)]);
        };
    },
});
