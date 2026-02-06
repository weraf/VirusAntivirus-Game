import { HtmlInstance, HtmlManager } from "./htmlmanager/htmlmanager.js";

export class Translator {

    static language = "sv"; // sv = svenska, en = engelska, da = danska, no = norska, fi = finska, zh = kinesiska

    // Nu laddas det in
    static dictionary = {

    }

    // Dictionary only for the language currently selected
    static currentDictionary = {}

    /**
     * 
     * @param {HtmlManager} manager 
     */
    static connectToHTMLManager(manager) {
        manager.addEventListener(HtmlManager.EVENTS.INSTANCE_CREATED, (event) => {
            Translator.onNewInstanceCreated(event.detail.instance)
        })
        console.log("connected!");
    }

    /**
     * 
     * @param {HtmlInstance} instance 
     */
    static onNewInstanceCreated(instance) {
        
        // Translate the newly created htmlinstance
        Translator.translateHTML(instance);
        instance.addEventListener(HtmlInstance.EVENTS.PLACEHOLDER_SET, (event) => {
            // A placeholder was set. If that placeholder is a language string, replace it with the translated text
            const placeholder = event.detail.placeholder;
            const value = event.detail.value;
            if (Translator.currentDictionary[value] !== undefined) {
                event.target.setPlaceholder(placeholder,this.getText(value));
            }
        })
        instance.addEventListener(HtmlInstance.EVENTS.SHOWN,(event) => {
            // When an instance is made visible, translate it
            Translator.translateHTML(event.target);
        })
    }
    
    
    /**
     * 
     * @param {HtmlInstance} htmlInstance 
     */
    static translateHTML(htmlInstance) {
        htmlInstance.setPlaceholders(Translator.currentDictionary,true);
    }

    static async fetchTranslations() {
        try {
            const response = await fetch("./ui/languages.json");
            const data = await response.json();
            Translator.dictionary = data;
            Translator.setLanguage(Translator.language);

            console.log("Language file loaded");
        } catch (err) {
            console.error("Failed to load language file:", err);
        }
    }

    static setLanguage(language) {
        Translator.language = language;
        // Cache the current translation
        Translator.currentDictionary = Object.fromEntries(Object.entries(Translator.dictionary).map(([k,v]) => [k, v[language]]))
    }

    // Placeholdernodes.keys, iterera genom dem för att replacea placeholders

    static getText(key) {
        return Translator.dictionary[key][Translator.language];
    }

    static getDictionary() {
        return Translator.dictionary;

    }

    static getLanguage() {
        return Translator.language;
    }

    static refreshInstances(instances) {
        // Used when changing languauge
        for (let instance of instances) {
            Translator.translateHTML(instance);
        }
    }
}
