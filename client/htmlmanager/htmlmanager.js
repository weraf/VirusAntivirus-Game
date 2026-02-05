export class HtmlManager {
    cache = {}
    cacheShort = {}
    baseURL
    parent
    instances = []
    /**
     * 
     * @param {*} parent The default DOM element to add things under 
     * @param {*} baseURL The base URL used when loading files
     */
    constructor(parent, baseURL = "") {
        if (parent == undefined) {
            throw new Error("Parent is not set");
        }
        
        this.parent = parent
        this.baseURL = baseURL;
        // Create css for handling hidden elements
        const customStyle = document.createElement("style")
        document.head.appendChild(customStyle)
        customStyle.sheet.insertRule(".hidden {display: none !important;}")
    }

    getCachedContents(path) {
        if (this.cacheShort[path] !== undefined) {
            return this.cacheShort[path];
        }
        if (this.cache[path] === undefined) {
            throw new Error(`${path} has not been loaded with HtmlLoader.load()`)
        }
        return this.cache[path];
    }

    async fetchHtmlContents(path) {
        const response = await fetch(this.baseURL+path);
        if (!response.ok) {
            throw new Error(`Error when fetching ${this.baseURL+path}: ${response.status}`)
        } 
        const htmltext = await response.text()
        
        return htmltext
    }

    /**
     * Load multiple files at once, waiting for them all in parallel
     * @param {*} paths 
     */
    async loadAll(paths) {
        const calls = []
        for (let path of paths) {
            calls.push(this.load(path))
        }
        await Promise.all(calls) // Wait until everything has been fetched
    }

    // Returns file name of path, ex: "ui/panel.hmtl" becomes "panel"
    getShortName(path) {
        let short = path.split("/").pop() // Grabs file name
        return short.split(".")[0];
    }

    /**
     * Load a html file into cache to be used later
     * @param {*} path 
     */
    async load(path) {
        let content = await this.fetchHtmlContents(path);
        this.cache[path] = content;
        // If multiple files has the same short name, the last loaded will be valid
        this.cacheShort[this.getShortName(path)] = content
    }
    
    /**
     * 
     * @param {string} path The path or name of the html file that's been loaded earlier
     * @param {Object} placeholders Values to set placeholders (if any)
     */
    create(path,placeholders={},parent=this.parent) {
        const html = this.getCachedContents(path);
        const newInstance = new HTMLInstance(parent,html);
        if (Object.keys(placeholders).length > 0) {
            newInstance.setPlaceholders(placeholders)
        }
        this.instances.push(newInstance);
        return newInstance;
    }

    /**
     * Shows showInstance and hides all instances sharing the same parent as showInstance
     * @param {*} showInstance 
     */
    showOnly(showInstance) {
        for (let instance of this.instances) {
            if (instance === showInstance) {
                instance.show();
            } else if (instance.parentNode === showInstance.parentNode) {
                instance.hide();
            }
        }
    }

    hideAll() {
        for (let instance of this.instances) {
            instance.hide();
        }
    }

    /**
     * Helper function to show a hidden html element
     * @param {*} element 
     */
    static show(element) {
        element.classList.remove("hidden")
    }
    
    /**
     * Helper function to hide a html element
     * @param {*} element 
     */
    static hide(element) {
        element.classList.add("hidden")
    }
}

class HTMLInstance {
    root;
    placeholderNodes = {}

    constructor(parent, html) {
        this.parent = parent
        const tempNode = document.createElement("div");
        tempNode.innerHTML = html;
        const contents = tempNode.firstChild;
        this.root = contents
        this.placeholderNodes = this.findPlaceholders();
        parent.appendChild(contents);
        this.findIds(this.root)
    }

    findPlaceholders() {
        // Go through all text in the instance, finding {tags}. Place them in a dictionary to be adressed later.
        let walker = document.createTreeWalker(this.root,NodeFilter.SHOW_TEXT)
        const foundPlaceholders = {};
        const regex = /{(\S)+}/;
        while (walker.nextNode()) {
            const node = walker.currentNode;
            let match;
            if ((match = regex.exec(node.nodeValue)) !== null) {
                const pKey = match[0];
                const key = pKey.slice(1,pKey.length-1);
                
                const split = node.nodeValue.split(pKey,2) // Split only the first one. Leave the rest of the string for treewalker to deal with
                
                const before = document.createTextNode(split[0])
                const placeholder = document.createTextNode(key)
                foundPlaceholders[key] = placeholder
                const after = document.createTextNode(split[1])
                // Add the nodes so that the order is the same as before, but split up
                node.parentNode.insertBefore(before,node) 
                node.parentNode.insertBefore(placeholder,node) 
                node.parentNode.insertBefore(after,node) 
                node.parentNode.removeChild(node)
                walker.currentNode = placeholder; // Move the search position to the replaced node, so that the next node will be new unseen text
            }
        }
        return foundPlaceholders
    }

    setPlaceholders(keys) {
        for (let [key, value] of Object.entries(keys)) {
            this.setPlaceholder(key,value)
        }
    }

    setPlaceholder(key,value) {
        if (this.placeholderNodes[key] === undefined) {
            return

            // lägg till extraparameter ignore om det kommer från translatorklassen 

            // throw new Error("Couldn't find placeholder: "+key)
        }

        this.placeholderNodes[key].nodeValue = value;
    }

    setLanguagePlaceholders(dict, language) {
        this.setPlaceholders(Object.fromEntries(Object.entries(dict).map(([k,v]) => [k, v[language]])));
    }

    findIds(parent) {
        for (let child of parent.children) {
            if (child.id !== "") {
                this[child.id] = child;
            }
            this.findIds(child);
        }
    }

    hide() {
        HtmlManager.hide(this.root);
    }

    /**
     * Hides this instance, and show another one 
     * @param {*} instance 
     */
    switchTo(instance) {
        this.hide();
        instance.show();
    }

    show() {
        HtmlManager.show(this.root);
    }
}