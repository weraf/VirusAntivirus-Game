export class Translator {

    static language = "sv"; // sv = svenska, en = engelska, da = danska, no = norska, fi = finska, zh = kinesiska


    static init = async () => {
        await Translator.setText();
    }

    // Nu laddas det in
    static dictionary = {

    }
    

    static async setText() {
        try {
            const response = await fetch("./test.json");
            const data = await response.json();

            Translator.dictionary = data;

            console.log("Language file loaded:", Translator.dictionary);
        } catch (err) {
            console.error("Failed to load language file:", err);
        }
    }

    static setLanguage(language) {
        Translator.language = language;
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
}
